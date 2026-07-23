import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChangeServiceStatusUseCase,
  CreateServiceUseCase,
  FindServiceByIdUseCase,
  UpdateServiceUseCase,
  ServiceErrors,
} from '../../../../src/core/entities/service/index.ts';

test('Exporta os casos de uso do módulo Service', () => {
  assert.equal(typeof ChangeServiceStatusUseCase, 'function');
  assert.equal(typeof CreateServiceUseCase, 'function');
  assert.equal(typeof FindServiceByIdUseCase, 'function');
  assert.equal(typeof UpdateServiceUseCase, 'function');
  assert.equal(typeof ServiceErrors.invalidPrice, 'function');
});
