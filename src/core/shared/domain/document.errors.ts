import { DomainError } from './domain.error.ts';

const DOCUMENT_TARGET = 'src/core/shared/domain/document.ts';

export const DOCUMENT_ERROR_CODE = {
  INVALID_CPF: 'DOCUMENT_INVALID_CPF',
  INVALID_CNPJ: 'DOCUMENT_INVALID_CNPJ',
  INVALID_PASSPORT: 'DOCUMENT_INVALID_PASSPORT',
  DOCUMENT_REQUIRED: 'DOCUMENT_REQUIRED',
} as const;

export const DocumentErrors = {
  invalidCpf: (value: string) => new DomainError({
    code: DOCUMENT_ERROR_CODE.INVALID_CPF,
    target: DOCUMENT_TARGET,
    message: `CPF ${value} is invalid.`,
  }),
  invalidCnpj: (value: string) => new DomainError({
    code: DOCUMENT_ERROR_CODE.INVALID_CNPJ,
    target: DOCUMENT_TARGET,
    message: `CNPJ ${value} is invalid.`,
  }),
  invalidPassport: (value: string) => new DomainError({
    code: DOCUMENT_ERROR_CODE.INVALID_PASSPORT,
    target: DOCUMENT_TARGET,
    message: `Passport ${value} is invalid.`,
  }),
  documentRequired: (documentType: string) => new DomainError({
    code: DOCUMENT_ERROR_CODE.DOCUMENT_REQUIRED,
    target: DOCUMENT_TARGET,
    message: `Document is required when documentType is ${documentType}.`,
  }),
};
