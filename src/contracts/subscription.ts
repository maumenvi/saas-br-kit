import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from "../core/index.ts";
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

export type SubscriptionStatusDto = SubscriptionStatus;

export type SubscriptionDto = Readonly<{
  id: string;
  organizationId: string;
  userId: string;
  customerId?: string;
  planId: string;
  status: SubscriptionStatusDto;
  provider: string;
  providerConnectionId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: SafeMetadataDto;
}>;

export type CreateSubscriptionInputDto = Readonly<{
  organizationId: string;
  userId: string;
  customerId: string;
  planId: string;
  requestedProvider?: string;
  metadata?: SafeMetadataDto;
}>;

export type SubscriptionPersistenceDto = SubscriptionDto;

export const subscriptionStatusSchema = new ContractSchema<SubscriptionStatusDto>(
  "subscriptionStatus",
  (value, path) => validateEnum(value, path, SUBSCRIPTION_STATUSES),
);

export const subscriptionDtoSchema = new ContractSchema<SubscriptionDto>(
  "subscriptionDto",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected subscription object.");
    }

    const id = validateNonEmptyString(value.id, [...path, "id"]);
    const organizationId = validateNonEmptyString(value.organizationId, [
      ...path,
      "organizationId",
    ]);
    const userId = validateNonEmptyString(value.userId, [...path, "userId"]);
    const customerId =
      value.customerId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.customerId, [...path, "customerId"]);
    const planId = validateNonEmptyString(value.planId, [...path, "planId"]);
    const status = subscriptionStatusSchema.validate(value.status, [...path, "status"]);
    const provider = validateNonEmptyString(value.provider, [...path, "provider"]);
    const providerConnectionId = validateNonEmptyString(value.providerConnectionId, [
      ...path,
      "providerConnectionId",
    ]);
    const providerCustomerId =
      value.providerCustomerId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.providerCustomerId, [...path, "providerCustomerId"]);
    const providerSubscriptionId =
      value.providerSubscriptionId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.providerSubscriptionId, [...path, "providerSubscriptionId"]);
    const currentPeriodStart =
      value.currentPeriodStart === undefined
        ? valid<string | undefined>(undefined)
        : validateIsoDateTime(value.currentPeriodStart, [...path, "currentPeriodStart"]);
    const currentPeriodEnd =
      value.currentPeriodEnd === undefined
        ? valid<string | undefined>(undefined)
        : validateIsoDateTime(value.currentPeriodEnd, [...path, "currentPeriodEnd"]);
    const createdAt = validateIsoDateTime(value.createdAt, [...path, "createdAt"]);
    const updatedAt = validateIsoDateTime(value.updatedAt, [...path, "updatedAt"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([
      id,
      organizationId,
      userId,
      customerId,
      planId,
      status,
      provider,
      providerConnectionId,
      providerCustomerId,
      providerSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      createdAt,
      updatedAt,
      metadata,
    ]);

    if (
      issues.length > 0 ||
      !id.ok ||
      !organizationId.ok ||
      !userId.ok ||
      !customerId.ok ||
      !planId.ok ||
      !status.ok ||
      !provider.ok ||
      !providerConnectionId.ok ||
      !providerCustomerId.ok ||
      !providerSubscriptionId.ok ||
      !currentPeriodStart.ok ||
      !currentPeriodEnd.ok ||
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
        userId: userId.value,
        ...(customerId.value === undefined ? {} : { customerId: customerId.value }),
        planId: planId.value,
        status: status.value,
        provider: provider.value,
        providerConnectionId: providerConnectionId.value,
        ...(providerCustomerId.value === undefined
          ? {}
          : { providerCustomerId: providerCustomerId.value }),
        ...(providerSubscriptionId.value === undefined
          ? {}
          : { providerSubscriptionId: providerSubscriptionId.value }),
        ...(currentPeriodStart.value === undefined
          ? {}
          : { currentPeriodStart: currentPeriodStart.value }),
        ...(currentPeriodEnd.value === undefined
          ? {}
          : { currentPeriodEnd: currentPeriodEnd.value }),
        createdAt: createdAt.value,
        updatedAt: updatedAt.value,
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const createSubscriptionInputSchema = new ContractSchema<CreateSubscriptionInputDto>(
  "createSubscriptionInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected create subscription input object.");
    }

    const organizationId = validateNonEmptyString(value.organizationId, [
      ...path,
      "organizationId",
    ]);
    const userId = validateNonEmptyString(value.userId, [...path, "userId"]);
    const customerId = validateNonEmptyString(value.customerId, [...path, "customerId"]);
    const planId = validateNonEmptyString(value.planId, [...path, "planId"]);
    const requestedProvider =
      value.requestedProvider === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.requestedProvider, [...path, "requestedProvider"]);
    const metadata =
      value.metadata === undefined
        ? valid<SafeMetadataDto | undefined>(undefined)
        : safeMetadataSchema.validate(value.metadata, [...path, "metadata"]);
    const issues = mergeValidationIssues([
      organizationId,
      userId,
      customerId,
      planId,
      requestedProvider,
      metadata,
    ]);

    if (
      issues.length > 0 ||
      !organizationId.ok ||
      !userId.ok ||
      !customerId.ok ||
      !planId.ok ||
      !requestedProvider.ok ||
      !metadata.ok
    ) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        organizationId: organizationId.value,
        userId: userId.value,
        customerId: customerId.value,
        planId: planId.value,
        ...(requestedProvider.value === undefined
          ? {}
          : { requestedProvider: requestedProvider.value }),
        ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
      }),
    );
  },
);

export const subscriptionPersistenceSchema = subscriptionDtoSchema;
