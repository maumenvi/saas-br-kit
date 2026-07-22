import test from 'node:test';
import type { MfaRepositoryPort } from '../../../../src/core/entities/mfa/mfa.repositories.ts';

test('Declara a porta de persistência MFA', () => {
  const repository = undefined as MfaRepositoryPort | undefined;
  void repository;
});
