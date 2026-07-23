import type {
  Verification,
  VerificationPurpose,
} from './verification.ts';

export type VerificationTarget = Readonly<{
  purpose: VerificationPurpose;
  actorId: string | null;
  organizationId: string | null;
  appointmentId?: string;
}>;

export type RegisterVerificationAttemptResult = Readonly<{
  attempts: number;
  rejected: boolean;
}>;

export interface VerificationRepositoryPort<
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> {
  save(
    verification: Verification<MembershipStatus, MembershipExtra>,
  ): Promise<void>;
  findById(
    id: string,
  ): Promise<Verification<MembershipStatus, MembershipExtra> | null>;
  acceptIfPending(id: string, acceptedAt: Date): Promise<boolean>;
  expireIfPending(id: string, expiredAt: Date): Promise<boolean>;
  expirePending(expiresAt: Date): Promise<number>;
  expirePendingFor(target: VerificationTarget, expiredAt: Date): Promise<number>;
  registerFailedAttempt(
    id: string,
    attemptedAt: Date,
  ): Promise<RegisterVerificationAttemptResult | null>;
}
