export const MFA_METHODS = ['TOTP'] as const;
export const MFA_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const;

export type MfaMethod = (typeof MFA_METHODS)[number];
export type MfaStatus = (typeof MFA_STATUSES)[number];

export type Mfa = Readonly<{
  id: string;
  actorId: string;
  method: MfaMethod;
  status: MfaStatus;
  providerCredential: string;
  lastUsedCounter: number | null;
  createdAt: Date;
  updatedAt: Date;
  activatedAt: Date | null;
}>;
