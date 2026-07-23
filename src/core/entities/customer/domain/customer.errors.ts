import { DomainError } from '../../../shared/domain/domain.error.ts';

const CUSTOMER_TARGET = 'src/core/entities/customer/customer.ts';

export const CUSTOMER_ERROR_CODE = {
  NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  CROSS_ORGANIZATION_REFERENCE: 'CUSTOMER_CROSS_ORGANIZATION_REFERENCE',
  EMAIL_PROVIDER_NOT_CONFIGURED: 'CUSTOMER_EMAIL_PROVIDER_NOT_CONFIGURED',
  TELEPHONE_PROVIDER_NOT_CONFIGURED:
    'CUSTOMER_TELEPHONE_PROVIDER_NOT_CONFIGURED',
} as const;

export const CustomerErrors = {
  notFound: (customerId: string) => new DomainError({
    code: CUSTOMER_ERROR_CODE.NOT_FOUND,
    target: CUSTOMER_TARGET,
    message: `Customer ${customerId} was not found.`,
  }),
  crossOrganizationReference: (customerId: string) => new DomainError({
    code: CUSTOMER_ERROR_CODE.CROSS_ORGANIZATION_REFERENCE,
    target: CUSTOMER_TARGET,
    message: `Customer ${customerId} belongs to another organization.`,
  }),
  emailProviderNotConfigured: () => new DomainError({
    code: CUSTOMER_ERROR_CODE.EMAIL_PROVIDER_NOT_CONFIGURED,
    target: CUSTOMER_TARGET,
    message: 'Email provider is not configured.',
  }),
  telephoneProviderNotConfigured: () => new DomainError({
    code: CUSTOMER_ERROR_CODE.TELEPHONE_PROVIDER_NOT_CONFIGURED,
    target: CUSTOMER_TARGET,
    message: 'Telephone message provider is not configured.',
  }),
};
