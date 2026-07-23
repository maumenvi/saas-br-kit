import assert from 'node:assert/strict';
import test from 'node:test';
import { CUSTOMER_ERROR_CODE, CustomerErrors } from '../../../../../src/core/entities/customer/domain/customer.errors.ts';

test('cria erros de customer', () => {
  assert.equal(CustomerErrors.notFound('1').code, CUSTOMER_ERROR_CODE.NOT_FOUND);
  assert.equal(
    CustomerErrors.emailProviderNotConfigured().code,
    CUSTOMER_ERROR_CODE.EMAIL_PROVIDER_NOT_CONFIGURED,
  );
});
