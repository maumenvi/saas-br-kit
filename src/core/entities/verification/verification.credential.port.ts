import type { VerificationPurpose } from './verification.ts';

export type IssuedVerificationCredential = Readonly<{
  value: string;
  hash: string;
}>;

export interface VerificationCredentialPort {
  issue(purpose: VerificationPurpose): Promise<IssuedVerificationCredential>;
  verify(value: string, hash: string): Promise<boolean>;
}

export type VerificationConfig = Readonly<{
  credentialProvider: VerificationCredentialPort;
  ttlMs: Readonly<Record<VerificationPurpose, number>>;
  maxAttempts: number;
}>;
