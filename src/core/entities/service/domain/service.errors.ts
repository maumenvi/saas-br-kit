import { DomainError } from '../../../shared/domain/domain.error.ts';

const SERVICE_TARGET = 'src/core/entities/service/service.ts';

export const SERVICE_ERROR_CODE = {
  INVALID_PRICE: 'SERVICE_INVALID_PRICE',
  INVALID_DURATION: 'SERVICE_INVALID_DURATION',
  INCLUDED_SERVICE_NOT_FOUND: 'SERVICE_INCLUDED_SERVICE_NOT_FOUND',
  CROSS_ORGANIZATION_REFERENCE: 'SERVICE_CROSS_ORGANIZATION_REFERENCE',
  SELF_INCLUDED: 'SERVICE_SELF_INCLUDED',
} as const;

export const ServiceErrors = {
  invalidPrice: () => new DomainError({
    code: SERVICE_ERROR_CODE.INVALID_PRICE,
    target: SERVICE_TARGET,
    message: 'Service price must be a non-negative integer in cents.',
  }),
  invalidDuration: () => new DomainError({
    code: SERVICE_ERROR_CODE.INVALID_DURATION,
    target: SERVICE_TARGET,
    message: 'Service durationMinutes must be a positive integer.',
  }),
  includedServiceNotFound: (serviceId: string) => new DomainError({
    code: SERVICE_ERROR_CODE.INCLUDED_SERVICE_NOT_FOUND,
    target: SERVICE_TARGET,
    message: `Included service ${serviceId} was not found.`,
  }),
  crossOrganizationReference: (serviceId: string) => new DomainError({
    code: SERVICE_ERROR_CODE.CROSS_ORGANIZATION_REFERENCE,
    target: SERVICE_TARGET,
    message: `Included service ${serviceId} belongs to another organization.`,
  }),
  selfIncluded: (serviceId: string) => new DomainError({
    code: SERVICE_ERROR_CODE.SELF_INCLUDED,
    target: SERVICE_TARGET,
    message: `Service ${serviceId} cannot include itself.`,
  }),
};
