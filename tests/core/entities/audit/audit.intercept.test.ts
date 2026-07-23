import assert from 'node:assert/strict';
import test from 'node:test';
import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { AuditIntercept } from '../../../../src/core/entities/audit/audit.intercept.ts';
import type { AuditRepositoryPort } from '../../../../src/core/entities/audit/audit.repositories.ts';
import type { Audit } from '../../../../src/core/entities/audit/audit.ts';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';

const permissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [],
};

test('Persiste entrada, retorno e identidade ao concluir uma ação', async () => {
  const audits: Audit[] = [];
  const interceptor = new AuditIntercept({
    action: 'actor:update',
    executionContext: executionContext(),
    auditRepository: repository(audits),
    permissionContext,
  });
  const input = {
    name: 'Marco',
    password: 'plain-secret',
    updatedAt: new Date('2026-07-21T10:00:00.000Z'),
  };
  const output = { updated: true, token: 'generated-token' };

  assert.equal(await interceptor.intercept(input, async () => output), output);

  assert.equal(audits.length, 1);
  assert.deepEqual(audits[0], {
    id: 'audit-1',
    action: 'actor:update',
    outcome: 'SUCCESS',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    membershipId: 'membership-1',
    input: {
      name: 'Marco',
      password: '[REDACTED]',
      updatedAt: '2026-07-21T10:00:00.000Z',
    },
    output: { updated: true, token: '[REDACTED]' },
    error: null,
    startedAt: new Date('2026-07-21T12:00:00.000Z'),
    completedAt: new Date('2026-07-21T12:00:00.025Z'),
    durationMs: 25,
  });
});

test('Persiste o erro estruturado e relança a mesma falha', async () => {
  const audits: Audit[] = [];
  const error = new DomainError({
    code: 'TEST_ERROR',
    target: 'audit.test',
    message: 'Operation failed.',
    details: { secret: 'sensitive-value', reason: 'invalid' },
  });
  const interceptor = new AuditIntercept({
    action: 'membership:update',
    executionContext: executionContext(),
    auditRepository: repository(audits),
    permissionContext,
  });

  await assert.rejects(
    interceptor.intercept({ id: 'membership-1' }, async () => {
      throw error;
    }),
    error,
  );

  assert.equal(audits.length, 1);
  assert.equal(audits[0]?.outcome, 'ERROR');
  assert.equal(audits[0]?.error?.code, 'TEST_ERROR');
  assert.equal(audits[0]?.error?.target, 'audit.test');
  assert.deepEqual(audits[0]?.error?.details, {
    secret: '[REDACTED]',
    reason: 'invalid',
  });
});

test('Falha ao salvar auditoria não altera o retorno da operação', async () => {
  const loggedErrors: unknown[][] = [];
  const interceptor = new AuditIntercept({
    action: 'organization:find-by-id',
    executionContext: executionContext(loggedErrors),
    auditRepository: {
      save: async () => {
        throw new Error('Audit unavailable.');
      },
    },
  });

  const output = await interceptor.intercept('organization-1', async () => ({
    id: 'organization-1',
  }));
  await flushDetachedAudit();

  assert.deepEqual(output, { id: 'organization-1' });
  assert.equal(loggedErrors.length, 1);
  assert.equal(loggedErrors[0]?.[0], 'Failed to persist audit.');
});

test('Não aguarda a persistência da auditoria para concluir a operação', async () => {
  let saveStarted = false;
  let finishSave: (() => void) | undefined;
  const interceptor = new AuditIntercept({
    action: 'actor:find-by-id',
    executionContext: executionContext(),
    auditRepository: {
      save: async () => {
        saveStarted = true;
        await new Promise<void>((resolve) => {
          finishSave = resolve;
        });
      },
    },
  });

  const result = await Promise.race([
    interceptor.intercept('actor-1', async () => 'operation-finished'),
    new Promise<string>((resolve) => {
      setImmediate(() => resolve('operation-blocked'));
    }),
  ]);

  assert.equal(result, 'operation-finished');
  assert.equal(saveStarted, true);
  finishSave?.();
  await flushDetachedAudit();
});

function repository(audits: Audit[]): AuditRepositoryPort {
  return {
    save: async (audit) => {
      audits.push(audit);
    },
  };
}

function executionContext(loggedErrors: unknown[][] = []): ExecutionContext {
  const times = [
    new Date('2026-07-21T12:00:00.000Z'),
    new Date('2026-07-21T12:00:00.025Z'),
  ];
  let timeIndex = 0;

  return new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: {
      error: (...args) => loggedErrors.push(args),
      warn: () => undefined,
      info: () => undefined,
      debug: () => undefined,
    },
    passwordHashProvider: new PasswordHashMock(),
    clock: () => times[timeIndex++] ?? times.at(-1)!,
    idGenerator: () => 'audit-1',
  });
}

function flushDetachedAudit(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
