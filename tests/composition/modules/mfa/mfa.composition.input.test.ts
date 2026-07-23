import test from 'node:test';
import type { MfaCompositionInput } from '../../../../src/composition/modules/mfa/mfa.composition.input.ts';

test('Declara o input da composition MFA', () => {
  const input = undefined as MfaCompositionInput<string> | undefined;
  void input;
});
