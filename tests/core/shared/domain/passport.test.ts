import assert from 'node:assert/strict';
import test from 'node:test';
import { Passport } from '../../../../src/core/shared/domain/passport.ts';

test('Aceita passaporte alfanumérico de 6 a 20 caracteres', () => {
  assert.doesNotThrow(() => new Passport('AB123456').validate());
});

test('Rejeita passaporte fora do formato recomendado', () => {
  assert.throws(() => new Passport('A-1').validate(), {
    code: 'DOCUMENT_INVALID_PASSPORT',
  });
});
