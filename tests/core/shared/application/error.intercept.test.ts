import test from 'node:test';
import assert from 'node:assert/strict';
import { ErrorIntercept } from '../../../../src/core/shared/application/error.intercept.ts';
import type { Handler } from '../../../../src/core/shared/application/handler.ts';
import type { LoggerPort } from '../../../../src/core/ports/logger.port.ts';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';

type LogEntry = {
  message: string;
  args: unknown[];
};

function createLogger(): LoggerPort & { errors: LogEntry[] } {
  const errors: LogEntry[] = [];
  return {
    errors,
    error(message, ...args) {
      errors.push({ message, args });
    },
    warn() { },
    info() { },
    debug() { },
  };
}

test('Encaminha o input e retorna o resultado do próximo handler', async () => {
  const receivedInputs: number[] = [];
  const next: Handler<number, number> = async (input) => {
    receivedInputs.push(input);
    return input + 1;
  };
  const logger = createLogger();
  const interceptor = new ErrorIntercept<number, number>(logger);

  assert.equal(await interceptor.intercept(1, next), 2);
  assert.deepEqual(receivedInputs, [1]);
  assert.deepEqual(logger.errors, []);
});

test('Registra e relança DomainError', async () => {
  const failure = new DomainError({
    code: 'USER_INVALID',
    target: 'core.user',
    message: 'Invalid user',
    details: { userId: 'user-1' },
  });
  const next: Handler<void, void> = async () => {
    throw failure;
  };
  const logger = createLogger();
  const interceptor = new ErrorIntercept<void, void>(logger);

  await assert.rejects(
    interceptor.intercept(undefined, next),
    (error) => error === failure,
  );
  assert.deepEqual(logger.errors, [{
    message: 'Invalid user',
    args: [{
      code: 'USER_INVALID',
      target: 'core.user',
      details: { userId: 'user-1' },
    }],
  }]);
});

test('Registra e relança Error comum', async () => {
  const failure = new Error('Unexpected failure');
  const next: Handler<void, void> = async () => {
    throw failure;
  };
  const logger = createLogger();
  const interceptor = new ErrorIntercept<void, void>(logger);

  await assert.rejects(
    interceptor.intercept(undefined, next),
    (error) => error === failure,
  );
  assert.equal(logger.errors[0]?.message, 'Unexpected failure');
  assert.strictEqual(logger.errors[0]?.args[0], failure);
});

test('Registra e relança valores desconhecidos', async () => {
  const failure = 'unknown failure';
  const next: Handler<void, void> = async () => {
    throw failure;
  };
  const logger = createLogger();
  const interceptor = new ErrorIntercept<void, void>(logger);

  await assert.rejects(
    interceptor.intercept(undefined, next),
    (error) => error === failure,
  );
  assert.deepEqual(logger.errors, [{
    message: 'Unknown error',
    args: [failure],
  }]);
});
