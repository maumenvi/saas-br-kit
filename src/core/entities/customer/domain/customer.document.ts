import { CNPJ } from '../../../shared/domain/cnpj.ts';
import { CPF } from '../../../shared/domain/cpf.ts';
import { DocumentErrors } from '../../../shared/domain/document.errors.ts';
import { Passport } from '../../../shared/domain/passport.ts';
import type { Customer } from '../customer.ts';

export function validateCustomerDocument(
  customer: Pick<Customer<unknown>, 'document' | 'documentType'>,
): void {
  if (!customer.documentType) return;
  if (!customer.document) throw DocumentErrors.documentRequired(customer.documentType);
  if (customer.documentType === 'cpf') new CPF(customer.document).validate();
  if (customer.documentType === 'cnpj') new CNPJ(customer.document).validate();
  if (customer.documentType === 'passport') new Passport(customer.document).validate();
}

export function anonymizeValue(value: string): string {
  if (value.length <= 2) return value;
  return `${'*'.repeat(value.length - 2)}${value.slice(-2)}`;
}
