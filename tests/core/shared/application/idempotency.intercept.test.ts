import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  IdempotencyAcquireResult,
  IdempotencyCompletion,
  IdempotencyExecution,
  IdempotencyPort,
  IdempotencyRelease,
} from '../../../../src/core/ports/idempotency.port.ts';
import {
  IDEMPOTENCY_ERROR_CODE,
  IdempotencyIntercept,
} from '../../../../src/core/shared/application/idempotency.intercept.ts';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';

class RecordingIdempotencyProvider implements IdempotencyPort {
  readonly executions: IdempotencyExecution<unknown>[] = [];
  readonly completions: IdempotencyCompletion<unknown>[] = [];
  readonly releases: IdempotencyRelease[] = [];
  acquisition: IdempotencyAcquireResult<unknown> = {
    status: 'ACQUIRED',
    leaseId: 'lease-1',
  };
  completionError?: Error;

  async acquire<Input, Output>(
    execution: IdempotencyExecution<Input>,
  ): Promise<IdempotencyAcquireResult<Output>> {
    this.executions.push(execution);
    return this.acquisition as IdempotencyAcquireResult<Output>;
  }

  async complete<Output>(
    completion: IdempotencyCompletion<Output>,
  ): Promise<void> {
    this.completions.push(completion);
    if (this.completionError) throw this.completionError;
  }

  async release(release: IdempotencyRelease): Promise<void> {
    this.releases.push(release);
  }
}

test('Adquire a execução e a conclui com a ação e o output', async () => {
  const provider = new RecordingIdempotencyProvider();
  const interceptor = new IdempotencyIntercept<number, number>(
    'number:double',
    provider,
  );

  const output = await interceptor.intercept(2, async (input) => input * 2);

  assert.equal(output, 4);
  assert.equal(provider.executions[0]?.action, 'number:double');
  assert.equal(provider.executions[0]?.input, 2);
  assert.equal(provider.executions[0]?.identity, undefined);
  assert.match(provider.executions[0]?.fingerprint ?? '', /^[a-f0-9]{64}$/);
  assert.match(provider.executions[0]?.key ?? '', /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(provider.executions[0]), true);
  assert.deepEqual(provider.completions[0], {
    fingerprint: provider.executions[0]?.fingerprint,
    key: provider.executions[0]?.key,
    leaseId: 'lease-1',
    output: 4,
  });
  assert.equal(Object.isFrozen(provider.completions[0]), true);
  assert.deepEqual(provider.releases, []);
});

test('Inclui a identidade protegida sem expor permissões', async () => {
  const provider = new RecordingIdempotencyProvider();
  const interceptor = new IdempotencyIntercept<number, number>(
    'number:double',
    provider,
    {
      actorId: 'actor-1',
      organizationId: 'organization-1',
    },
  );

  await interceptor.intercept(2, async (input) => input * 2);

  assert.deepEqual(provider.executions[0]?.identity, {
    actorId: 'actor-1',
    organizationId: 'organization-1',
  });
  assert.equal(Object.isFrozen(provider.executions[0]?.identity), true);
});

test('Gera a mesma chave para a mesma identidade e body canônico', async () => {
  const provider = new RecordingIdempotencyProvider();
  const interceptor = new IdempotencyIntercept<Record<string, unknown>, void>(
    'actor:create',
    provider,
    {
      actorId: 'actor-1',
      organizationId: 'organization-1',
    },
  );

  await interceptor.intercept(
    { name: 'Marco', enabled: true },
    async () => undefined,
  );
  await interceptor.intercept(
    { enabled: true, name: 'Marco' },
    async () => undefined,
  );

  assert.equal(
    provider.executions[0]?.fingerprint,
    provider.executions[1]?.fingerprint,
  );
  assert.equal(provider.executions[0]?.key, provider.executions[1]?.key);
});

test('Altera a chave quando o body ou a identidade mudam', async () => {
  const provider = new RecordingIdempotencyProvider();
  const actorOne = new IdempotencyIntercept<{ name: string }, void>(
    'actor:create',
    provider,
    { actorId: 'actor-1', organizationId: 'organization-1' },
  );
  const actorTwo = new IdempotencyIntercept<{ name: string }, void>(
    'actor:create',
    provider,
    { actorId: 'actor-2', organizationId: 'organization-1' },
  );

  await actorOne.intercept({ name: 'Marco' }, async () => undefined);
  await actorOne.intercept({ name: 'Maria' }, async () => undefined);
  await actorTwo.intercept({ name: 'Marco' }, async () => undefined);

  assert.notEqual(provider.executions[0]?.fingerprint, provider.executions[1]?.fingerprint);
  assert.notEqual(provider.executions[0]?.key, provider.executions[1]?.key);
  assert.equal(provider.executions[0]?.fingerprint, provider.executions[2]?.fingerprint);
  assert.notEqual(provider.executions[0]?.key, provider.executions[2]?.key);
});

test('Reproduz o resultado sem executar ou concluir novamente', async () => {
  const provider = new RecordingIdempotencyProvider();
  provider.acquisition = { status: 'REPLAY', output: 42 };
  let handlerExecutions = 0;
  const interceptor = new IdempotencyIntercept<number, number>(
    'number:cached',
    provider,
  );

  const output = await interceptor.intercept(2, async () => {
    handlerExecutions += 1;
    return 4;
  });

  assert.equal(output, 42);
  assert.equal(handlerExecutions, 0);
  assert.deepEqual(provider.completions, []);
  assert.deepEqual(provider.releases, []);
});

test('Nega uma execução concorrente ainda em andamento', async () => {
  const provider = new RecordingIdempotencyProvider();
  provider.acquisition = { status: 'IN_PROGRESS' };
  let handlerExecutions = 0;
  const interceptor = new IdempotencyIntercept<number, number>(
    'number:double',
    provider,
  );

  await assert.rejects(
    interceptor.intercept(2, async () => {
      handlerExecutions += 1;
      return 4;
    }),
    (error) =>
      error instanceof DomainError &&
      error.code === IDEMPOTENCY_ERROR_CODE.IN_PROGRESS,
  );

  assert.equal(handlerExecutions, 0);
  assert.deepEqual(provider.completions, []);
  assert.deepEqual(provider.releases, []);
});

test('Libera a lease quando o handler falha', async () => {
  const provider = new RecordingIdempotencyProvider();
  const failure = new Error('handler failed');
  const interceptor = new IdempotencyIntercept<number, number>(
    'number:double',
    provider,
  );

  await assert.rejects(
    interceptor.intercept(2, async () => {
      throw failure;
    }),
    (error) => error === failure,
  );

  assert.deepEqual(provider.completions, []);
  assert.deepEqual(provider.releases[0], {
    fingerprint: provider.executions[0]?.fingerprint,
    key: provider.executions[0]?.key,
    leaseId: 'lease-1',
  });
  assert.equal(Object.isFrozen(provider.releases[0]), true);
});

test('Não libera a lease quando a conclusão do provider falha', async () => {
  const provider = new RecordingIdempotencyProvider();
  const failure = new Error('completion failed');
  provider.completionError = failure;
  const interceptor = new IdempotencyIntercept<number, number>(
    'number:double',
    provider,
  );

  await assert.rejects(
    interceptor.intercept(2, async (input) => input * 2),
    (error) => error === failure,
  );

  assert.equal(provider.completions.length, 1);
  assert.deepEqual(provider.releases, []);
});
