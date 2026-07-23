import assert from 'node:assert/strict';
import test from 'node:test';
import { anonymizeValue, validateCustomerDocument } from '../../../../../src/core/entities/customer/domain/customer.document.ts';
import { DOCUMENT_ERROR_CODE } from '../../../../../src/core/shared/domain/document.errors.ts';

test('aceita documento sem tipo e valida CPF quando tipado', () => {
  assert.doesNotThrow(() => validateCustomerDocument({ document: 'livre' }));
  assert.throws(
    () => validateCustomerDocument({ documentType: 'cpf', document: '123' }),
    { code: DOCUMENT_ERROR_CODE.INVALID_CPF },
  );
});

test('anonimiza preservando dois últimos caracteres e tamanho', () => {
  assert.equal(anonymizeValue('abcdef'), '****ef');
  assert.equal(anonymizeValue('ab').length, 2);
});
