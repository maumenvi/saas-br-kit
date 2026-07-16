import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';
import { Telephone } from '../../../../../src/core/entities/user/domain/telephone.ts';

test('Preserva e valida telefone E.164', () => {
  const telephone = new Telephone('+5511999999999');

  assert.equal(telephone.value, '+5511999999999');
  assert.doesNotThrow(() => telephone.validate());
});

test('Rejeita telefone sem prefixo internacional', () => {
  const telephone = new Telephone('5511999999999');

  assert.throws(
    () => telephone.validate(),
    (error) => error instanceof DomainError && error.code === 'USER_INVALID_PHONE',
  );
});

test('Rejeita telefone maior que o limite E.164', () => {
  const telephone = new Telephone('+1234567890123456');

  assert.throws(() => telephone.validate(), DomainError);
});
