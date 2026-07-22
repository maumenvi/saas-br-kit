import { DomainError } from '../../../shared/domain/domain.error.ts';

const MFA_TARGET = 'src/core/entities/mfa/mfa.ts';

export const MFA_ERROR_CODE = {
  MFA_ACTOR_NOT_FOUND: 'MFA_ACTOR_NOT_FOUND',
  MFA_ACTOR_TYPE_NOT_ALLOWED: 'MFA_ACTOR_TYPE_NOT_ALLOWED',
  MFA_ACTOR_NOT_ENABLED: 'MFA_ACTOR_NOT_ENABLED',
  MFA_ALREADY_CONFIGURED: 'MFA_ALREADY_CONFIGURED',
  MFA_NOT_CONFIGURED: 'MFA_NOT_CONFIGURED',
  MFA_NOT_ACTIVE: 'MFA_NOT_ACTIVE',
  MFA_CODE_REQUIRED: 'MFA_CODE_REQUIRED',
  MFA_INVALID_CODE: 'MFA_INVALID_CODE',
  MFA_CODE_REUSED: 'MFA_CODE_REUSED',
} as const;

export const MfaErrors = {
  actorNotFound: (actorId: string) => new DomainError({
    code: MFA_ERROR_CODE.MFA_ACTOR_NOT_FOUND,
    target: MFA_TARGET,
    message: `Actor ${actorId} was not found for MFA configuration.`,
  }),
  actorTypeNotAllowed: (actorId: string) => new DomainError({
    code: MFA_ERROR_CODE.MFA_ACTOR_TYPE_NOT_ALLOWED,
    target: MFA_TARGET,
    message: `Actor ${actorId} is not a USER and cannot configure MFA.`,
  }),
  actorNotEnabled: (actorId: string) => new DomainError({
    code: MFA_ERROR_CODE.MFA_ACTOR_NOT_ENABLED,
    target: MFA_TARGET,
    message: `Actor ${actorId} is not enabled for MFA configuration.`,
  }),
  alreadyConfigured: (actorId: string) => new DomainError({
    code: MFA_ERROR_CODE.MFA_ALREADY_CONFIGURED,
    target: MFA_TARGET,
    message: `Actor ${actorId} already has an MFA configuration.`,
  }),
  notConfigured: (actorId: string) => new DomainError({
    code: MFA_ERROR_CODE.MFA_NOT_CONFIGURED,
    target: MFA_TARGET,
    message: `Actor ${actorId} does not have an MFA configuration.`,
  }),
  notActive: (actorId: string) => new DomainError({
    code: MFA_ERROR_CODE.MFA_NOT_ACTIVE,
    target: MFA_TARGET,
    message: `MFA for actor ${actorId} is disabled.`,
  }),
  codeRequired: () => new DomainError({
    code: MFA_ERROR_CODE.MFA_CODE_REQUIRED,
    target: MFA_TARGET,
    message: 'An MFA code is required to authenticate.',
  }),
  invalidCode: () => new DomainError({
    code: MFA_ERROR_CODE.MFA_INVALID_CODE,
    target: MFA_TARGET,
    message: 'The MFA code is invalid.',
  }),
  codeReused: () => new DomainError({
    code: MFA_ERROR_CODE.MFA_CODE_REUSED,
    target: MFA_TARGET,
    message: 'The MFA code has already been used.',
  }),
};
