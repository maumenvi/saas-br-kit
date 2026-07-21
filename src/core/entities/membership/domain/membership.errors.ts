import { DomainError } from '../../../shared/domain/domain.error.ts';

const MEMBERSHIP_TARGET = 'src/core/entities/membership/domain/membership.ts';

export const MEMBERSHIP_ERROR_CODE = {
  MEMBERSHIP_NOT_FOUND: 'MEMBERSHIP_NOT_FOUND',
  MEMBERSHIP_ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',
  MEMBERSHIP_ORGANIZATION_NOT_FOUND: 'MEMBERSHIP_ORGANIZATION_NOT_FOUND',
  MEMBERSHIP_ORGANIZATION_NOT_ENABLED: 'MEMBERSHIP_ORGANIZATION_NOT_ENABLED',
  MEMBERSHIP_ACTOR_NOT_FOUND: 'MEMBERSHIP_ACTOR_NOT_FOUND',
  MEMBERSHIP_ACTOR_NOT_ENABLED: 'MEMBERSHIP_ACTOR_NOT_ENABLED',
  MEMBERSHIP_SELF_ELEVATION_NOT_ALLOWED: 'MEMBERSHIP_SELF_ELEVATION_NOT_ALLOWED',
} as const;

export const MembershipErrors = {
  notFound: (membershipId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_NOT_FOUND,
    target: MEMBERSHIP_TARGET,
    message: `Membership with id ${membershipId} not found.`,
  }),
  alreadyExists: (actorId: string, organizationId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ALREADY_EXISTS,
    target: MEMBERSHIP_TARGET,
    message: `Membership for actor ${actorId} in organization ${organizationId} already exists.`,
  }),
  actorNotFound: (actorId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ACTOR_NOT_FOUND,
    target: MEMBERSHIP_TARGET,
    message: `Actor ${actorId} not found.`,
  }),
  actorNotEnabled: (actorId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ACTOR_NOT_ENABLED,
    target: MEMBERSHIP_TARGET,
    message: `Actor ${actorId} is not enabled.`,
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
  selfElevationNotAllowed: (actorId: string) => new DomainError({
    code: MEMBERSHIP_ERROR_CODE.MEMBERSHIP_SELF_ELEVATION_NOT_ALLOWED,
    target: MEMBERSHIP_TARGET,
    message: `Actor ${actorId} is not allowed to elevate their own membership.`,
  }),
};
