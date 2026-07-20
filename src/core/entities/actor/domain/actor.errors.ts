import { DomainError } from '../../../shared/domain/domain.error.ts';

const ACTOR_TARGET = 'src/core/entities/actor/domain/actor.ts';

export const ACTOR_ERROR_CODE = {
  ACTOR_NOT_FOUND: 'ACTOR_NOT_FOUND',
  ACTOR_ALREADY_EXISTS: 'ACTOR_ALREADY_EXISTS',
  ACTOR_INVALID_EMAIL: 'ACTOR_INVALID_EMAIL',
  ACTOR_INVALID_PHONE: 'ACTOR_INVALID_PHONE',
} as const;

export const ActorErrors = {
  notFound: (actorId: string) => new DomainError({
    code: ACTOR_ERROR_CODE.ACTOR_NOT_FOUND,
    target: ACTOR_TARGET,
    message: `Actor with id ${actorId} not found.`,
  }),
  alreadyExists: (email: string) => new DomainError({
    code: ACTOR_ERROR_CODE.ACTOR_ALREADY_EXISTS,
    target: ACTOR_TARGET,
    message: `Actor with email ${email} already exists.`,
  }),
  invalidEmail: (email: string) => new DomainError({
    code: ACTOR_ERROR_CODE.ACTOR_INVALID_EMAIL,
    target: ACTOR_TARGET,
    message: `Actor with email ${email} is invalid.`,
  }),
  invalidPhone: (phone: string) => new DomainError({
    code: ACTOR_ERROR_CODE.ACTOR_INVALID_PHONE,
    target: ACTOR_TARGET,
    message: `Actor with phone ${phone} is invalid.`,
  }),
};
