import test from 'node:test';
import type { AuthApplication } from '../../../src/composition/application/auth.application.ts';

test('Declara somente a superfície pública de autenticação', () => {
  const auth = undefined as AuthApplication<string> | undefined;
  void auth;
});
