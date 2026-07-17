import { DomainError } from '../../../shared/domain/domain.error.ts';

const AUTH_TARGET = 'src/core/entities/auth/domain/auth.ts';

export const MEMBERSHIP_ERROR_CODE = {
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  MEMBERSHIP_ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',
  MEMBERSHIP_ORGANIZATION_NOT_FOUND: 'MEMBERSHIP_ORGANIZATION_NOT_FOUND',
  MEMBERSHIP_ORGANIZATION_NOT_ENABLED: 'MEMBERSHIP_ORGANIZATION_NOT_ENABLED',
  MEMBERSHIP_USER_NOT_FOUND: 'MEMBERSHIP_USER_NOT_FOUND',
  MEMBERSHIP_USER_NOT_ENABLED: 'MEMBERSHIP_USER_NOT_ENABLED',
} as const;

export const MembershipErrors = {
  notFound: () => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.AUTH_UNAUTHORIZED,
    target: AUTH_TARGET,
    message: `User is not authorized.`,
  }),
  alreadyExists: (userId: string, organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ALREADY_EXISTS,
    target: AUTH_TARGET,
    message: `Membership for user ${userId} in organization ${organizationId} already exists.`,
  }),
  userNotFound: (userId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_USER_NOT_FOUND,
    target: AUTH_TARGET,
    message: `User ${userId} not found.`,
  }),
  userNotEnabled: (userId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_USER_NOT_ENABLED,
    target: AUTH_TARGET,
    message: `User ${userId} is not enabled.`,
  }),
  organizationNotFound: (organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ORGANIZATION_NOT_FOUND,
    target: AUTH_TARGET,
    message: `Organization ${organizationId} not found.`,
  }),
  organizationNotEnabled: (organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ORGANIZATION_NOT_ENABLED,
    target: AUTH_TARGET,
    message: `Organization ${organizationId} is not enabled.`,
  }),
};
