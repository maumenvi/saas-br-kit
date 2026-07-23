import type {
  IssuedVerificationCredential,
  VerificationCredentialPort,
} from '../core/entities/verification/verification.credential.port.ts';
import type { VerificationConfig } from '../core/entities/verification/verification.credential.port.ts';
import type { VerificationPurpose } from '../core/entities/verification/verification.ts';

export class VerificationCredentialMock implements VerificationCredentialPort {
  private sequence = 0;

  issue(_purpose: VerificationPurpose): Promise<IssuedVerificationCredential> {
    this.sequence += 1;
    const value = `credential-${this.sequence}`;
    return Promise.resolve(Object.freeze({ value, hash: `hash:${value}` }));
  }

  verify(value: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash:${value}`);
  }
}

export function verificationConfigMock(): VerificationConfig {
  return Object.freeze({
    credentialProvider: new VerificationCredentialMock(),
    ttlMs: Object.freeze({
      EMAIL_CONFIRMATION: 15 * 60 * 1000,
      TELEPHONE_CONFIRMATION: 5 * 60 * 1000,
      ORGANIZATION_INVITATION: 7 * 24 * 60 * 60 * 1000,
    }),
    maxAttempts: 5,
  });
}
