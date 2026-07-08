import {
  PLAN_BILLING_INTERVALS,
  PLAN_STATUSES,
  type PlanBillingInterval,
  type PlanStatus,
} from "../core/index.ts";
import { type SafeMetadataDto, safeMetadataSchema } from "./metadata.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  type SchemaValidationIssue,
  valid,
  validateEnum,
  validateIntegerPositiveSafe,
  validateIsoDateTime,
  validateLiteral,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type PlanStatusDto = PlanStatus;
export type PlanBillingIntervalDto = PlanBillingInterval;
export type PlanCurrencyDto = "BRL";

export type PlanPriceDto = Readonly<{
  amountCents: number;
  currency: PlanCurrencyDto;
  interval: PlanBillingIntervalDto;
}>;

export type PlanDto = Readonly<{
  id: string;
  organizationId: string;
  code: string;
  name: string;
  price: PlanPriceDto;
  features: readonly string[];
  status: PlanStatusDto;
  createdAt: string;
  updatedAt: string;
  metadata?: SafeMetadataDto;
}>;

export type CreatePlanInputDto = Readonly<{
  organizationId: string;
  code: string;
  name: string;
  amountCents: number;
  interval: PlanBillingIntervalDto;
  features?: readonly string[];
  metadata?: SafeMetadataDto;
}>;

export type PlanPersistenceDto = PlanDto;

export const planStatusSchema = new ContractSchema<PlanStatusDto>("planStatus", (value, path) =>
  validateEnum(value, path, PLAN_STATUSES),
);

export const planBillingIntervalSchema = new ContractSchema<PlanBillingIntervalDto>(
  "planBillingInterval",
  (value, path) => validateEnum(value, path, PLAN_BILLING_INTERVALS),
);

export const planCurrencySchema = new ContractSchema<PlanCurrencyDto>(
  "planCurrency",
  (value, path) => validateLiteral(value, path, "BRL"),
);

function validateFeatureList(
  value: unknown,
  path: readonly string[],
): import("./schema-validation.ts").SchemaValidationResult<readonly string[]> {
  if (!Array.isArray(value)) {
    return invalid(path, "Expected features array.");
  }

  const issues: SchemaValidationIssue[] = [];
  const features: string[] = [];
  for (const [index, feature] of value.entries()) {
    const result = validateNonEmptyString(feature, [...path, String(index)]);
    if (result.ok) {
      features.push(result.value);
    } else {
      issues.push(...result.issues);
    }
  }

  return issues.length === 0 ? valid(Object.freeze(features)) : { ok: false, issues };
}

export const planPriceDtoSchema = new ContractSchema<PlanPriceDto>(
  "planPriceDto",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected plan price object.");
    }

    const amountCents = validateIntegerPositiveSafe(value.amountCents, [...path, "amountCents"]);
    const currency = planCurrencySchema.validate(value.currency, [...path, "currency"]);
    const interval = planBillingIntervalSchema.validate(value.interval, [...path, "interval"]);
    const issues = mergeValidationIssues([amountCents, currency, interval]);

    if (issues.length > 0 || !amountCents.ok || !currency.ok || !interval.ok) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        amountCents: amountCents.value,
        currency: currency.value,
        interval: interval.value,
      }),
    );
  },
);

export const planDtoSchema = new ContractSchema<PlanDto>("planDto", (value, path) => {
  if (!isPlainRecord(value)) {
    return invalid(path, "Expected plan object.");
  }

  const id = validateNonEmptyString(value.id, [...path, "id"]);
  const organizationId = validateNonEmptyString(value.organizationId, [...path, "organizationId"]);
  const code = validateNonEmptyString(value.code, [...path, "code"]);
  const name = validateNonEmptyString(value.name, [...path, "name"]);
  const price = planPriceDtoSchema.validate(value.price, [...path, "price"]);
  const features = validateFeatureList(value.features, [...path, "features"]);
  const status = planStatusSchema.validate(value.status, [...path, "status"]);
  const createdAt = validateIsoDateTime(value.createdAt, [...path, "createdAt"]);
  const updatedAt = validateIsoDateTime(value.updatedAt, [...path, "updatedAt"]);
  const metadata =
    value.metadata === undefined
      ? valid<SafeMetadataDto | undefined>(undefined)
      : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
  const issues = mergeValidationIssues([
    id,
    organizationId,
    code,
    name,
    price,
    features,
    status,
    createdAt,
    updatedAt,
    metadata,
  ]);

  if (
    issues.length > 0 ||
    !id.ok ||
    !organizationId.ok ||
    !code.ok ||
    !name.ok ||
    !price.ok ||
    !features.ok ||
    !status.ok ||
    !createdAt.ok ||
    !updatedAt.ok ||
    !metadata.ok
  ) {
    return { ok: false, issues };
  }

  return valid(
    Object.freeze({
      id: id.value,
      organizationId: organizationId.value,
      code: code.value,
      name: name.value,
      price: price.value,
      features: features.value,
      status: status.value,
      createdAt: createdAt.value,
      updatedAt: updatedAt.value,
      ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
    }),
  );
});

export const createPlanInputSchema = new ContractSchema<CreatePlanInputDto>(
  "createPlanInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected create plan input object.");
    }

    const organizationId = validateNonEmptyString(value.organizationId, [
      ...path,
      "organizationId",
    ]);
    const code = validateNonEmptyString(value.code, [...path, "code"]);
    const name = validateNonEmptyString(value.name, [...path, "name"]);
    const amountCents = validateIntegerPositiveSafe(value.amountCents, [...path, "amountCents"]);
    const interval = planBillingIntervalSchema.validate(value.interval, [...path, "interval"]);
    const features =
      value.features === undefined
        ? valid<readonly string[] | undefined>(undefined)
        : validateFeatureList(value.features, [...path, "features"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([
      organizationId,
      code,
      name,
      amountCents,
      interval,
      features,
      metadata,
    ]);

    if (
      issues.length > 0 ||
      !organizationId.ok ||
      !code.ok ||
      !name.ok ||
      !amountCents.ok ||
      !interval.ok ||
      !features.ok ||
      !metadata.ok
    ) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        organizationId: organizationId.value,
        code: code.value,
        name: name.value,
        amountCents: amountCents.value,
        interval: interval.value,
        ...(features.value === undefined ? {} : { features: features.value }),
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const planPersistenceSchema = planDtoSchema;
