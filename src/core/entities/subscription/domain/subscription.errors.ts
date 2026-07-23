import { DomainError } from '../../../shared/domain/domain.error.ts';

const SUBSCRIPTION_TARGET = 'src/core/entities/subscription/subscription.ts';

export const SUBSCRIPTION_ERROR_CODE = {
  NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'SUBSCRIPTION_CUSTOMER_NOT_FOUND',
  PLAN_NOT_FOUND: 'SUBSCRIPTION_PLAN_NOT_FOUND',
  CROSS_ORGANIZATION_REFERENCE: 'SUBSCRIPTION_CROSS_ORGANIZATION_REFERENCE',
  INVALID_PRICE: 'SUBSCRIPTION_INVALID_PRICE',
  INVALID_RECURRENCE: 'SUBSCRIPTION_INVALID_RECURRENCE',
  PAYMENT_OVERDUE: 'SUBSCRIPTION_PAYMENT_OVERDUE',
  SERVICE_NOT_INCLUDED: 'SUBSCRIPTION_SERVICE_NOT_INCLUDED',
  SERVICE_LIMIT_REACHED: 'SUBSCRIPTION_SERVICE_LIMIT_REACHED',
  INVALID_USAGE: 'SUBSCRIPTION_INVALID_USAGE',
} as const;

const error = (code: string, message: string) => new DomainError({
  code,
  target: SUBSCRIPTION_TARGET,
  message,
});

export const SubscriptionErrors = {
  notFound: (id: string) => error(SUBSCRIPTION_ERROR_CODE.NOT_FOUND, `Subscription ${id} was not found.`),
  customerNotFound: (id: string) => error(SUBSCRIPTION_ERROR_CODE.CUSTOMER_NOT_FOUND, `Customer ${id} was not found.`),
  planNotFound: (id: string) => error(SUBSCRIPTION_ERROR_CODE.PLAN_NOT_FOUND, `Plan ${id} was not found.`),
  crossOrganizationReference: (id: string) => error(
    SUBSCRIPTION_ERROR_CODE.CROSS_ORGANIZATION_REFERENCE,
    `Referenced entity ${id} belongs to another organization.`,
  ),
  invalidPrice: () => error(SUBSCRIPTION_ERROR_CODE.INVALID_PRICE, 'Subscription price must be a non-negative integer in cents.'),
  invalidRecurrence: () => error(SUBSCRIPTION_ERROR_CODE.INVALID_RECURRENCE, 'Subscription recurrenceDays must be a positive integer.'),
  paymentOverdue: (id: string) => error(SUBSCRIPTION_ERROR_CODE.PAYMENT_OVERDUE, `Subscription ${id} payment is overdue.`),
  serviceNotIncluded: (id: string) => error(SUBSCRIPTION_ERROR_CODE.SERVICE_NOT_INCLUDED, `Service ${id} is not included in the subscription.`),
  serviceLimitReached: (id: string) => error(SUBSCRIPTION_ERROR_CODE.SERVICE_LIMIT_REACHED, `Service ${id} usage limit was reached.`),
  invalidUsage: (id: string) => error(
    SUBSCRIPTION_ERROR_CODE.INVALID_USAGE,
    `Service ${id} usage must be an integer between zero and quantity.`,
  ),
};
