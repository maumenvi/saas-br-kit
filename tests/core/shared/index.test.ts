import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DomainError,
  ErrorIntercept,
  IDEMPOTENCY_ERROR_CODE,
  IdempotencyIntercept,
  IdempotencyErrors,
} from '../../../src/core/shared/index.ts';

test('Exporta os componentes compartilhados', () => {
  assert.equal(typeof DomainError, 'function');
  assert.equal(typeof ErrorIntercept, 'function');
  assert.equal(typeof IdempotencyIntercept, 'function');
  assert.equal(IDEMPOTENCY_ERROR_CODE.IN_PROGRESS, 'IDEMPOTENCY_IN_PROGRESS');
  assert.equal(typeof IdempotencyErrors.inProgress, 'function');
});
