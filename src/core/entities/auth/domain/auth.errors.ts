import { DomainError } from '../../../shared/domain/domain.error.ts';

const AUTH_TARGET = 'src/core/entities/auth/domain/auth.ts';

export const AUTH_ERROR_CODE = {
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_INVALID_TYPE: 'AUTH_INVALID_TYPE',
} as const;

export const AuthErrors = {
  unauthorized: () => new DomainError({
    code: AUTH_ERROR_CODE.AUTH_UNAUTHORIZED,
    target: AUTH_TARGET,
    message: `User is not authorized.`,
  }),
  authFailed: () => new DomainError({
    code: AUTH_ERROR_CODE.AUTH_FAILED,
    target: AUTH_TARGET,
    message: `Authentication failed.`,
  }),
  invalidType: () => new DomainError({
    code: AUTH_ERROR_CODE.AUTH_INVALID_TYPE,
    target: AUTH_TARGET,
    message: `Invalid authentication type.`,
  }),
};
