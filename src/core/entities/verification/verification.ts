import type { Membership } from '../membership/membership.ts';

export const VERIFICATION_CHANNELS = ['EMAIL', 'TELEPHONE'] as const;
export const VERIFICATION_PURPOSES = [
  'EMAIL_CONFIRMATION',
  'TELEPHONE_CONFIRMATION',
  'ORGANIZATION_INVITATION',
  'APPOINTMENT_RESPONSE',
] as const;
export const VERIFICATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
] as const;

export type VerificationChannel = (typeof VERIFICATION_CHANNELS)[number];
export type VerificationPurpose = (typeof VERIFICATION_PURPOSES)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

type BaseVerification = Readonly<{
  id: string;
  credentialHash: string;
  status: VerificationStatus;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  expiredAt: Date | null;
}>;

export type EmailConfirmationVerification = BaseVerification & Readonly<{
  actorId: string;
  destination: string;
  purpose: 'EMAIL_CONFIRMATION';
  channel: 'EMAIL';
  organizationId: null;
}>;

export type TelephoneConfirmationVerification = BaseVerification & Readonly<{
  actorId: string;
  destination: string;
  purpose: 'TELEPHONE_CONFIRMATION';
  channel: 'TELEPHONE';
  organizationId: null;
}>;

export type OrganizationInvitationVerification<
  MembershipStatus,
  MembershipExtra = unknown,
> = BaseVerification & Readonly<{
  actorId: string;
  destination: string;
  purpose: 'ORGANIZATION_INVITATION';
  channel: 'EMAIL';
  organizationId: string;
  membership: Membership<MembershipStatus, MembershipExtra>;
}>;

export type AppointmentResponseVerification = BaseVerification & Readonly<{
  purpose: 'APPOINTMENT_RESPONSE';
  channel: null;
  actorId: null;
  destination: null;
  organizationId: string;
  customerId: string;
  appointmentId: string;
}>;

export type Verification<MembershipStatus = unknown, MembershipExtra = unknown> =
  | EmailConfirmationVerification
  | TelephoneConfirmationVerification
  | OrganizationInvitationVerification<MembershipStatus, MembershipExtra>
  | AppointmentResponseVerification;
