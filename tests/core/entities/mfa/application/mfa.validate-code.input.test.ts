import test from 'node:test';
import type {
  ValidateMfaCodeInput,
  ValidateMfaCodeOutput,
} from '../../../../../src/core/entities/mfa/application/mfa.validate-code.input.ts';

test('Declara os contratos de validação do código MFA', () => {
  const input = undefined as ValidateMfaCodeInput | undefined;
  const output = undefined as ValidateMfaCodeOutput | undefined;
  void input;
  void output;
});
