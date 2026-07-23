import assert from 'node:assert/strict';
import test from 'node:test';
import { SERVICE_ERROR_CODE, ServiceErrors } from '../../../../../src/core/entities/service/domain/service.errors.ts';

test('cria erros de service', () => {
  assert.equal(ServiceErrors.invalidPrice().code, SERVICE_ERROR_CODE.INVALID_PRICE);
});
