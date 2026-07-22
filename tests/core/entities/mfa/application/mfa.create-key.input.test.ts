import test from 'node:test';
import type {
  CreateMfaKeyInput,
  CreateMfaKeyOutput,
} from '../../../../../src/core/entities/mfa/application/mfa.create-key.input.ts';

test('Declara os contratos de criação da chave MFA', () => {
  const input = undefined as CreateMfaKeyInput | undefined;
  const output = undefined as CreateMfaKeyOutput | undefined;
  void input;
  void output;
});
