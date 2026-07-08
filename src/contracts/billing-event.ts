import { BILLING_EVENT_TYPES, type BillingEventType } from "../core/index.ts";
import { type SafeMetadataDto, safeMetadataSchema } from "./metadata.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  valid,
  validateEnum,
  validateIsoDateTime,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type BillingEventTypeDto = BillingEventType;

export type BillingEventDto = Readonly<{
  id: string;
  type: BillingEventTypeDto;
  occurredAt: string;
  organizationId?: string;
  planId?: string;
  subscriptionId?: string;
  metadata?: SafeMetadataDto;
}>;

export type BillingEventPersistenceDto = BillingEventDto;

export const billingEventTypeSchema = new ContractSchema<BillingEventTypeDto>(
  "billingEventType",
  (value, path) => validateEnum(value, path, BILLING_EVENT_TYPES),
);

export const billingEventDtoSchema = new ContractSchema<BillingEventDto>(
  "billingEventDto",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected billing event object.");
    }

    const id = validateNonEmptyString(value.id, [...path, "id"]);
    const type = billingEventTypeSchema.validate(value.type, [...path, "type"]);
    const occurredAt = validateIsoDateTime(value.occurredAt, [...path, "occurredAt"]);
    const organizationId =
      value.organizationId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.organizationId, [...path, "organizationId"]);
    const planId =
      value.planId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.planId, [...path, "planId"]);
    const subscriptionId =
      value.subscriptionId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.subscriptionId, [...path, "subscriptionId"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([
      id,
      type,
      occurredAt,
      organizationId,
      planId,
      subscriptionId,
      metadata,
    ]);

    if (
      issues.length > 0 ||
      !id.ok ||
      !type.ok ||
      !occurredAt.ok ||
      !organizationId.ok ||
      !planId.ok ||
      !subscriptionId.ok ||
      !metadata.ok
    ) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        id: id.value,
        type: type.value,
        occurredAt: occurredAt.value,
        ...(organizationId.value === undefined ? {} : { organizationId: organizationId.value }),
        ...(planId.value === undefined ? {} : { planId: planId.value }),
        ...(subscriptionId.value === undefined ? {} : { subscriptionId: subscriptionId.value }),
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const billingEventPersistenceSchema = billingEventDtoSchema;
