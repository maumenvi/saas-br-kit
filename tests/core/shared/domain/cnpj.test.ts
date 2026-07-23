import test from 'node:test';
import assert from 'node:assert/strict';
import { CNPJ } from '../../../../src/core/shared/domain/cnpj.ts';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';

const validCnpjs = [
  '12.ABC.345/01DE-35',
  '90.021.382/0001-22',
  '90.024.778/0001-23',
  '90.025.108/0001-21',
  '90.025.255/0001-00',
  '90.024.420/0001-09',
  '90.024.781/0001-47',
  '04.740.714/0001-97',
  '44.108.058/0001-29',
  '90.024.780/0001-00',
  '90.024.779/0001-78',
  '00000000000191',
  'ABCDEFGHIJKL80',
];

const invalidCnpjs = [
  '',
  "'!@#$%&*-_=+^~",
  '$0123456789ABC',
  '0123456?789ABC',
  '0123456789ABC#',
  '12.ABc.345/01DE-35',
  '0000000000019',
  '000000000001911',
  '0000000000019L',
  '000000000001P1',
  '00000000000192',
  'ABCDEFGHIJKL81',
  '00000000000000',
  '00.000.000/0000-00',
];

test('Preserva o CNPJ recebido', () => {
  const value = '90.021.382/0001-22';

  assert.equal(new CNPJ(value).value, value);
});

test('Aceita CNPJs numéricos e alfanuméricos com dígitos verificadores válidos', () => {
  for (const value of validCnpjs) {
    assert.doesNotThrow(() => new CNPJ(value).validate(), value);
  }
});

test('Rejeita CNPJs inválidos', () => {
  for (const value of invalidCnpjs) {
    assert.throws(
      () => new CNPJ(value).validate(),
      (error) => (
        error instanceof DomainError
        && error.code === 'DOCUMENT_INVALID_CNPJ'
        && error.message.includes(value)
      ),
      value || 'CNPJ vazio',
    );
  }
});
