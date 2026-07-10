import test from 'node:test';
import assert from 'node:assert/strict';
import { InterceptErrorUseCase } from '../../../../../src/core/shared/application/interceptor/intercept.error.use.case.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import type { LoggerPort } from '../../../../../src/core/shared/application/ports/logger.port.ts';
import type { UseCase } from '../../../../../src/core/shared/application/use.case.ts';

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
    warn() {},
    info() {},
    debug() {},
  };
}

test('Retorna o resultado do caso de uso decorado', async () => {
  const useCase: UseCase<number, number> = {
    async execute(input) {
      return input + 1;
    },
  };
  const logger = createLogger();
  const interceptor = new InterceptErrorUseCase(useCase, logger);

  assert.equal(await interceptor.execute(1), 2);
  assert.deepEqual(logger.errors, []);
});

test('Registra e relança DomainError', async () => {
  const failure = new DomainError({
    code: 'USER_INVALID',
    target: 'core.user',
    message: 'Invalid user',
    details: { userId: 'user-1' },
  });
  const useCase: UseCase<void, void> = {
    async execute() {
      throw failure;
    },
  };
  const logger = createLogger();
  const interceptor = new InterceptErrorUseCase(useCase, logger);

  await assert.rejects(interceptor.execute(), (error) => error === failure);
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
  const useCase: UseCase<void, void> = {
    async execute() {
      throw failure;
    },
  };
  const logger = createLogger();
  const interceptor = new InterceptErrorUseCase(useCase, logger);

  await assert.rejects(interceptor.execute(), (error) => error === failure);
  assert.equal(logger.errors[0]?.message, 'Unexpected failure');
  assert.strictEqual(logger.errors[0]?.args[0], failure);
});

test('Registra e relança valores desconhecidos', async () => {
  const failure = 'unknown failure';
  const useCase: UseCase<void, void> = {
    async execute() {
      throw failure;
    },
  };
  const logger = createLogger();
  const interceptor = new InterceptErrorUseCase(useCase, logger);

  await assert.rejects(interceptor.execute(), (error) => error === failure);
  assert.deepEqual(logger.errors, [{
    message: 'Unknown error',
    args: [failure],
  }]);
});
