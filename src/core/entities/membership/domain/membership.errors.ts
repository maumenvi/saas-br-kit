import { DomainError } from '../../../shared/domain/domain.error.ts';

const MEMBERSHIP_TARGET = 'src/core/entities/membership/domain/membership.ts';

export const MEMBERSHIP_ERROR_CODE = {
  MEMBERSHIP_NOT_FOUND: 'MEMBERSHIP_NOT_FOUND',
  MEMBERSHIP_ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',
  MEMBERSHIP_ORGANIZATION_NOT_FOUND: 'MEMBERSHIP_ORGANIZATION_NOT_FOUND',
  MEMBERSHIP_ORGANIZATION_NOT_ENABLED: 'MEMBERSHIP_ORGANIZATION_NOT_ENABLED',
  MEMBERSHIP_USER_NOT_FOUND: 'MEMBERSHIP_USER_NOT_FOUND',
  MEMBERSHIP_USER_NOT_ENABLED: 'MEMBERSHIP_USER_NOT_ENABLED',
} as const;

export const MembershipErrors = {
  notFound: (membershipId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_NOT_FOUND,
    target: MEMBERSHIP_TARGET,
    message: `Membership with id ${membershipId} not found.`,
  }),
  alreadyExists: (userId: string, organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ALREADY_EXISTS,
    target: MEMBERSHIP_TARGET,
    message: `Membership for user ${userId} in organization ${organizationId} already exists.`,
  }),
  userNotFound: (userId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_USER_NOT_FOUND,
    target: MEMBERSHIP_TARGET,
    message: `User ${userId} not found.`,
  }),
  userNotEnabled: (userId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_USER_NOT_ENABLED,
    target: MEMBERSHIP_TARGET,
    message: `User ${userId} is not enabled.`,
  }),
  organizationNotFound: (organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ORGANIZATION_NOT_FOUND,
    target: MEMBERSHIP_TARGET,
    message: `Organization ${organizationId} not found.`,
  }),
  organizationNotEnabled: (organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ORGANIZATION_NOT_ENABLED,
    target: MEMBERSHIP_TARGET,
    message: `Organization ${organizationId} is not enabled.`,
  }),
};
