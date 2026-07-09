import { CUSTOMER_STATUSES, type CustomerStatus } from "../core/index.ts";
import { type SafeMetadataDto, safeMetadataSchema } from "./metadata.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  valid,
  validateEmail,
  validateEnum,
  validateIsoDateTime,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type CustomerDto = Readonly<{
  id: string;
  organizationId: string;
  name: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  email?: string;
  document?: string;
  metadata?: SafeMetadataDto;
}>;

export type CreateCustomerInputDto = Readonly<{
  organizationId: string;
  name: string;
  email?: string;
  document?: string;
  metadata?: SafeMetadataDto;
}>;

export const createCustomerInputSchema = new ContractSchema<CreateCustomerInputDto>(
  "createCustomerInput",
  (value, path) => {
    if (!isPlainRecord(value)) return invalid(path, "Expected create customer input object.");
    const organizationId = validateNonEmptyString(value.organizationId, [
      ...path,
      "organizationId",
    ]);
    const name = validateNonEmptyString(value.name, [...path, "name"]);
    const email =
      value.email === undefined
        ? valid<string | undefined>(undefined)
        : validateEmail(value.email, [...path, "email"]);
    const document =
      value.document === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.document, [...path, "document"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([organizationId, name, email, document, metadata]);
    if (
      issues.length > 0 ||
      !organizationId.ok ||
      !name.ok ||
      !email.ok ||
      !document.ok ||
      !metadata.ok
    ) {
      return { ok: false, issues };
    }
    return valid(
      Object.freeze({
        organizationId: organizationId.value,
        name: name.value,
        ...(email.value === undefined ? {} : { email: email.value }),
        ...(document.value === undefined ? {} : { document: document.value }),
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const customerDtoSchema = new ContractSchema<CustomerDto>("customerDto", (value, path) => {
  if (!isPlainRecord(value)) return invalid(path, "Expected customer object.");
  const base = createCustomerInputSchema.validate(value, path);
  const id = validateNonEmptyString(value.id, [...path, "id"]);
  const status = validateEnum(value.status, [...path, "status"], CUSTOMER_STATUSES);
  const createdAt = validateIsoDateTime(value.createdAt, [...path, "createdAt"]);
  const updatedAt = validateIsoDateTime(value.updatedAt, [...path, "updatedAt"]);
  const issues = mergeValidationIssues([base, id, status, createdAt, updatedAt]);
  if (issues.length > 0 || !base.ok || !id.ok || !status.ok || !createdAt.ok || !updatedAt.ok) {
    return { ok: false, issues };
  }
  return valid(
    Object.freeze({
      id: id.value,
      ...base.value,
      status: status.value,
      createdAt: createdAt.value,
      updatedAt: updatedAt.value,
    }),
  );
});
