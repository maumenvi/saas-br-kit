import { Subscription, type SubscriptionStatus } from "#core";
import { asRow, jsonValue, optionalString, safeMetadata, toDate, toIsoString } from "./helpers.ts";

/** Maps Subscription entities to and from Prisma rows. */
export class PrismaSubscriptionMapper {
  /** Converts a domain subscription into Prisma persistence data. */
  toPersistence(subscription: Subscription): Record<string, unknown> {
    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      ...(subscription.userId === undefined ? {} : { userId: subscription.userId }),
      ...(subscription.customerId === undefined ? {} : { customerId: subscription.customerId }),
      planId: subscription.planId,
      status: subscription.status,
      provider: subscription.provider,
      providerConnectionId: subscription.providerConnectionId,
      providerCustomerId: subscription.providerCustomerId,
      providerSubscriptionId: subscription.providerSubscriptionId,
      currentPeriodStart: toDate(subscription.currentPeriodStart),
      currentPeriodEnd: toDate(subscription.currentPeriodEnd),
      metadata: subscription.metadata === undefined ? undefined : jsonValue(subscription.metadata),
      createdAt: new Date(subscription.createdAt),
      updatedAt: new Date(subscription.updatedAt),
    };
  }

  /** Rehydrates a domain subscription from a Prisma row. */
  toDomain(row: unknown): Subscription {
    const data = asRow(row);
    const providerCustomerId = optionalString(data.providerCustomerId);
    const providerSubscriptionId = optionalString(data.providerSubscriptionId);
    const userId = optionalString(data.userId);
    const customerId = optionalString(data.customerId);
    const metadata = safeMetadata(data.metadata);
    const result = Subscription.create({
      id: String(data.id),
      organizationId: String(data.organizationId),
      ...(userId === undefined ? {} : { userId }),
      ...(customerId === undefined ? {} : { customerId }),
      planId: String(data.planId),
      status: String(data.status) as SubscriptionStatus,
      provider: String(data.provider),
      providerConnectionId: String(data.providerConnectionId),
      ...(providerCustomerId === undefined ? {} : { providerCustomerId }),
      ...(providerSubscriptionId === undefined ? {} : { providerSubscriptionId }),
      ...(data.currentPeriodStart === null || data.currentPeriodStart === undefined
        ? {}
        : { currentPeriodStart: toIsoString(data.currentPeriodStart) }),
      ...(data.currentPeriodEnd === null || data.currentPeriodEnd === undefined
        ? {}
        : { currentPeriodEnd: toIsoString(data.currentPeriodEnd) }),
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      ...(metadata === undefined ? {} : { metadata }),
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

export const prismaSubscriptionMapper = new PrismaSubscriptionMapper();
