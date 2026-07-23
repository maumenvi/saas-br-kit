import { DomainError } from '../../../shared/domain/domain.error.ts';

const APPOINTMENT_TARGET = 'src/core/entities/appointment/appointment.ts';

export const APPOINTMENT_ERROR_CODE = {
  NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'APPOINTMENT_CUSTOMER_NOT_FOUND',
  SERVICE_NOT_FOUND: 'APPOINTMENT_SERVICE_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND: 'APPOINTMENT_SUBSCRIPTION_NOT_FOUND',
  TENANT_MISMATCH: 'APPOINTMENT_TENANT_MISMATCH',
  INVALID_DATETIME: 'APPOINTMENT_INVALID_DATETIME',
  DATETIME_UNAVAILABLE: 'APPOINTMENT_DATETIME_UNAVAILABLE',
  SUBSCRIPTION_REQUIRED: 'APPOINTMENT_SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_FORBIDDEN: 'APPOINTMENT_SUBSCRIPTION_FORBIDDEN',
  SUBSCRIPTION_PAYMENT_REQUIRED: 'APPOINTMENT_SUBSCRIPTION_PAYMENT_REQUIRED',
  SUBSCRIPTION_SERVICE_UNAVAILABLE:
    'APPOINTMENT_SUBSCRIPTION_SERVICE_UNAVAILABLE',
  PAYMENT_TYPE_MUST_BE_SUBSCRIPTION:
    'APPOINTMENT_PAYMENT_TYPE_MUST_BE_SUBSCRIPTION',
  PAYMENT_TYPE_CANNOT_BE_SUBSCRIPTION:
    'APPOINTMENT_PAYMENT_TYPE_CANNOT_BE_SUBSCRIPTION',
  ALREADY_CANCELLED: 'APPOINTMENT_ALREADY_CANCELLED',
  CANCELLATION_REQUIRES_CANCEL_USE_CASE:
    'APPOINTMENT_CANCELLATION_REQUIRES_CANCEL_USE_CASE',
} as const;

const error = (code: string, message: string) => new DomainError({
  code,
  target: APPOINTMENT_TARGET,
  message,
});

export const AppointmentErrors = {
  notFound: (id: string) => error(
    APPOINTMENT_ERROR_CODE.NOT_FOUND,
    `Appointment ${id} was not found.`,
  ),
  customerNotFound: (id: string) => error(
    APPOINTMENT_ERROR_CODE.CUSTOMER_NOT_FOUND,
    `Customer ${id} was not found.`,
  ),
  serviceNotFound: (id: string) => error(
    APPOINTMENT_ERROR_CODE.SERVICE_NOT_FOUND,
    `Service ${id} was not found.`,
  ),
  subscriptionNotFound: (id: string) => error(
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_NOT_FOUND,
    `Subscription ${id} was not found.`,
  ),
  tenantMismatch: (id: string) => error(
    APPOINTMENT_ERROR_CODE.TENANT_MISMATCH,
    `Referenced entity ${id} belongs to another organization.`,
  ),
  invalidDatetime: () => error(
    APPOINTMENT_ERROR_CODE.INVALID_DATETIME,
    'Appointment final datetime must be after its initial datetime.',
  ),
  datetimeUnavailable: () => error(
    APPOINTMENT_ERROR_CODE.DATETIME_UNAVAILABLE,
    'Appointment datetime is unavailable.',
  ),
  subscriptionRequired: () => error(
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_REQUIRED,
    'subscriptionId is required for a plan service appointment.',
  ),
  subscriptionForbidden: () => error(
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_FORBIDDEN,
    'subscriptionId is forbidden for a non-plan appointment.',
  ),
  subscriptionPaymentRequired: (id: string) => error(
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_PAYMENT_REQUIRED,
    `Subscription ${id} payment is not current.`,
  ),
  subscriptionServiceUnavailable: (id: string) => error(
    APPOINTMENT_ERROR_CODE.SUBSCRIPTION_SERVICE_UNAVAILABLE,
    `Service ${id} is unavailable in the subscription.`,
  ),
  paymentTypeMustBeSubscription: () => error(
    APPOINTMENT_ERROR_CODE.PAYMENT_TYPE_MUST_BE_SUBSCRIPTION,
    'paymentType must be subscription for a plan service appointment.',
  ),
  paymentTypeCannotBeSubscription: () => error(
    APPOINTMENT_ERROR_CODE.PAYMENT_TYPE_CANNOT_BE_SUBSCRIPTION,
    'paymentType subscription is forbidden for a non-plan appointment.',
  ),
  alreadyCancelled: (id: string) => error(
    APPOINTMENT_ERROR_CODE.ALREADY_CANCELLED,
    `Appointment ${id} is already cancelled.`,
  ),
  cancellationRequiresCancelUseCase: () => error(
    APPOINTMENT_ERROR_CODE.CANCELLATION_REQUIRES_CANCEL_USE_CASE,
    'Appointment cancellation must use the cancellation use case.',
  ),
};
