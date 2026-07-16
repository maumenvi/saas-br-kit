import { DomainError } from '../../../shared/domain/domain.error.ts';

const ORGANIZATION_TARGET = 'src/core/organization/domain/organization.ts';

export const ORGANIZATION_ERROR_CODE = {
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  ORGANIZATION_ALREADY_EXISTS: 'ORGANIZATION_ALREADY_EXISTS',
  ORGANIZATION_INVALID_CNPJ: 'ORGANIZATION_INVALID_CNPJ',
} as const;

export const OrganizationErrors = {
  notFound: (organizationId: string) => new DomainError({
    code: ORGANIZATION_ERROR_CODE.ORGANIZATION_NOT_FOUND,
    target: ORGANIZATION_TARGET,
    message: `Organization with id ${organizationId} not found.`,
  }),
  alreadyExists: (email: string) => new DomainError({
    code: ORGANIZATION_ERROR_CODE.ORGANIZATION_ALREADY_EXISTS,
    target: ORGANIZATION_TARGET,
    message: `Organization with email ${email} already exists.`,
  }),
  invalidCNPJ: (cnpj: string) => new DomainError({
    code: ORGANIZATION_ERROR_CODE.ORGANIZATION_INVALID_CNPJ,
    target: ORGANIZATION_TARGET,
    message: `Organization with CNPJ ${cnpj} is invalid.`,
  }),
}
