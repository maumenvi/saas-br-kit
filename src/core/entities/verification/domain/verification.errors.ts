import { DomainError } from '../../../shared/domain/domain.error.ts';
import type { VerificationPurpose } from '../verification.ts';

const VERIFICATION_TARGET = 'src/core/entities/verification/verification.ts';

export const VERIFICATION_ERROR_CODE = {
  NOT_FOUND: 'VERIFICATION_NOT_FOUND',
  INVALID_CREDENTIAL: 'VERIFICATION_INVALID_CREDENTIAL',
  EXPIRED: 'VERIFICATION_EXPIRED',
  REJECTED: 'VERIFICATION_REJECTED',
  ALREADY_ACCEPTED: 'VERIFICATION_ALREADY_ACCEPTED',
  TRANSITION_CONFLICT: 'VERIFICATION_TRANSITION_CONFLICT',
  INVALID_CONFIG: 'VERIFICATION_INVALID_CONFIG',
  CONTACT_ALREADY_VERIFIED: 'VERIFICATION_CONTACT_ALREADY_VERIFIED',
  CONTACT_CHANGED: 'VERIFICATION_CONTACT_CHANGED',
} as const;

export const VerificationErrors = {
  notFound: (verificationId: string) => new DomainError({
    code: VERIFICATION_ERROR_CODE.NOT_FOUND,
    target: VERIFICATION_TARGET,
    message: `Verification ${verificationId} was not found.`,
  }),
  invalidCredential: () => new DomainError({
    code: VERIFICATION_ERROR_CODE.INVALID_CREDENTIAL,
    target: VERIFICATION_TARGET,
    message: 'Verification credential is invalid.',
  }),
  expired: (verificationId: string) => new DomainError({
    code: VERIFICATION_ERROR_CODE.EXPIRED,
    target: VERIFICATION_TARGET,
    message: `Verification ${verificationId} is expired.`,
  }),
  rejected: (verificationId: string) => new DomainError({
    code: VERIFICATION_ERROR_CODE.REJECTED,
    target: VERIFICATION_TARGET,
    message: `Verification ${verificationId} is rejected.`,
  }),
  alreadyAccepted: (verificationId: string) => new DomainError({
    code: VERIFICATION_ERROR_CODE.ALREADY_ACCEPTED,
    target: VERIFICATION_TARGET,
    message: `Verification ${verificationId} was already accepted.`,
  }),
  transitionConflict: (verificationId: string) => new DomainError({
    code: VERIFICATION_ERROR_CODE.TRANSITION_CONFLICT,
    target: VERIFICATION_TARGET,
    message: `Verification ${verificationId} changed during acceptance.`,
  }),
  invalidConfig: (field: string) => new DomainError({
    code: VERIFICATION_ERROR_CODE.INVALID_CONFIG,
    target: VERIFICATION_TARGET,
    message: `Verification config field ${field} must be greater than zero.`,
  }),
  contactAlreadyVerified: (actorId: string, purpose: VerificationPurpose) =>
    new DomainError({
      code: VERIFICATION_ERROR_CODE.CONTACT_ALREADY_VERIFIED,
      target: VERIFICATION_TARGET,
      message: `Actor ${actorId} already completed ${purpose}.`,
    }),
  contactChanged: (actorId: string, purpose: VerificationPurpose) =>
    new DomainError({
      code: VERIFICATION_ERROR_CODE.CONTACT_CHANGED,
      target: VERIFICATION_TARGET,
      message: `Actor ${actorId} contact changed before ${purpose} was accepted.`,
    }),
};
