import test from 'node:test';
import type {
  OrganizationRegistrationInput,
  OrganizationRegistrationOutput,
} from '../../../../../src/core/entities/organization/application/organization.registration.input.ts';

test('Declara os contratos do cadastro público de organização', () => {
  const input = undefined as
    | OrganizationRegistrationInput<string, string, string>
    | undefined;
  const output = undefined as OrganizationRegistrationOutput | undefined;

  void input;
  void output;
});
