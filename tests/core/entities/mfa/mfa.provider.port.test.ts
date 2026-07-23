import test from 'node:test';
import type { MfaProviderPort } from '../../../../src/core/entities/mfa/mfa.provider.port.ts';

test('Declara a porta do provider MFA', () => {
  const port = undefined as MfaProviderPort | undefined;
  void port;
});
