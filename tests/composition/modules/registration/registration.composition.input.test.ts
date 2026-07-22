import test from 'node:test';
import type { RegistrationCompositionInput } from '../../../../src/composition/modules/registration/registration.composition.input.ts';

test('Declara o input da composition de cadastro público', () => {
  const input = undefined as
    | RegistrationCompositionInput<string, string, string>
    | undefined;
  void input;
});
