import assert from 'node:assert/strict';
import test from 'node:test';
import { CPF } from '../../../../src/core/shared/domain/cpf.ts';

test('Valida CPF numérico ou mascarado', () => {
  assert.doesNotThrow(() => new CPF('529.982.247-25').validate());
  assert.doesNotThrow(() => new CPF('52998224725').validate());
});

test('Rejeita CPF inválido', () => {
  assert.throws(() => new CPF('111.111.111-11').validate(), {
    code: 'DOCUMENT_INVALID_CPF',
  });
});
