import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChangeCustomerStatusUseCase,
  CreateCustomerUseCase,
  FindCustomerByIdUseCase,
  UpdateCustomerUseCase,
  AnonymizeCustomerUseCase,
  CUSTOMER_DOCUMENT_TYPES,
} from '../../../../src/core/entities/customer/index.ts';

test('Exporta os casos de uso do módulo Customer', () => {
  assert.equal(typeof ChangeCustomerStatusUseCase, 'function');
  assert.equal(typeof CreateCustomerUseCase, 'function');
  assert.equal(typeof FindCustomerByIdUseCase, 'function');
  assert.equal(typeof UpdateCustomerUseCase, 'function');
  assert.equal(typeof AnonymizeCustomerUseCase, 'function');
  assert.deepEqual(CUSTOMER_DOCUMENT_TYPES, ['cpf', 'cnpj', 'passport', 'other']);
});
