import type { EntityInput } from '../../shared/input/entity.input.ts';

export const CUSTOMER_DOCUMENT_TYPES = ['cpf', 'cnpj', 'passport', 'other'] as const;
export type CustomerDocumentType = (typeof CUSTOMER_DOCUMENT_TYPES)[number];

export type Customer<Status, Extra = unknown> = EntityInput<Status> & {
  organizationId: string;
  name: string;
  email: string;
  telephone: string;
  document?: string;
  documentType?: CustomerDocumentType;
} & Extra;
