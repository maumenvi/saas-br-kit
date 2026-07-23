import { DomainError } from '../../../shared/domain/domain.error.ts';

const PLAN_TARGET = 'src/core/entities/plan/plan.ts';

export const PLAN_ERROR_CODE = {
  INVALID_PRICE: 'PLAN_INVALID_PRICE',
  INVALID_QUANTITY: 'PLAN_INVALID_QUANTITY',
  SERVICE_NOT_FOUND: 'PLAN_SERVICE_NOT_FOUND',
  CROSS_ORGANIZATION_REFERENCE: 'PLAN_CROSS_ORGANIZATION_REFERENCE',
} as const;

export const PlanErrors = {
  invalidPrice: () => new DomainError({
    code: PLAN_ERROR_CODE.INVALID_PRICE,
    target: PLAN_TARGET,
    message: 'Plan price must be a non-negative integer in cents.',
  }),
  invalidQuantity: (serviceId: string) => new DomainError({
    code: PLAN_ERROR_CODE.INVALID_QUANTITY,
    target: PLAN_TARGET,
    message: `Plan service ${serviceId} quantity must be a positive integer.`,
  }),
  serviceNotFound: (serviceId: string) => new DomainError({
    code: PLAN_ERROR_CODE.SERVICE_NOT_FOUND,
    target: PLAN_TARGET,
    message: `Plan service ${serviceId} was not found.`,
  }),
  crossOrganizationReference: (serviceId: string) => new DomainError({
    code: PLAN_ERROR_CODE.CROSS_ORGANIZATION_REFERENCE,
    target: PLAN_TARGET,
    message: `Plan service ${serviceId} belongs to another organization.`,
  }),
};
