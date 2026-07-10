import { DomainError } from "../../shared/domain/domain.error.ts";

const USER_TARGET = 'src/core/user/domain/user.ts';

export const USER_ERROR_CODE = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INVALID_EMAIL: 'USER_INVALID_EMAIL',
  USER_INVALID_PHONE: 'USER_INVALID_PHONE',
} as const;

export const UserErrors = {
  notFound: (userId: string) => new DomainError({
    code: USER_ERROR_CODE.USER_NOT_FOUND,
    target: USER_TARGET,
    message: `User with id ${userId} not found.`,
  }),
  alreadyExists: (email: string) => new DomainError({
    code: USER_ERROR_CODE.USER_ALREADY_EXISTS,
    target: USER_TARGET,
    message: `User with email ${email} already exists.`,
  }),
  invalidEmail: (email: string) => new DomainError({
    code: USER_ERROR_CODE.USER_INVALID_EMAIL,
    target: USER_TARGET,
    message: `User with email ${email} is invalid.`,
  }),
  invalidPhone: (phone: string) => new DomainError({
    code: USER_ERROR_CODE.USER_INVALID_PHONE,
    target: USER_TARGET,
    message: `User with phone ${phone} is invalid.`,
  }),
}
