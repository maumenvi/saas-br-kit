import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DOCUMENT_ERROR_CODE,
  DocumentErrors,
} from '../../../../src/core/shared/domain/document.errors.ts';

test('Expõe erros compartilhados de documento', () => {
  assert.equal(DocumentErrors.invalidCpf('x').code, DOCUMENT_ERROR_CODE.INVALID_CPF);
  assert.equal(DocumentErrors.invalidCnpj('x').code, DOCUMENT_ERROR_CODE.INVALID_CNPJ);
  assert.equal(DocumentErrors.invalidPassport('x').code, DOCUMENT_ERROR_CODE.INVALID_PASSPORT);
  assert.equal(DocumentErrors.documentRequired('cpf').code, DOCUMENT_ERROR_CODE.DOCUMENT_REQUIRED);
});
