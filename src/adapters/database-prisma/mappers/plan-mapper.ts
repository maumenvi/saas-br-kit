import { Plan, type PlanBillingInterval, type PlanCurrency } from "#core";
import { asRow, jsonArray, jsonValue, safeMetadata, toIsoString } from "./helpers.ts";

/** Maps Plan entities to and from Prisma rows. */
export class PrismaPlanMapper {
  /** Converts a domain plan into Prisma persistence data. */
  toPersistence(plan: Plan): Record<string, unknown> {
    return {
      id: plan.id,
      organizationId: plan.organizationId,
      code: plan.code,
      name: plan.name,
      amountCents: plan.price.amountCents,
      currency: plan.price.currency,
      interval: plan.price.interval,
      features: [...plan.features],
      status: plan.status,
      metadata: plan.metadata === undefined ? undefined : jsonValue(plan.metadata),
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
    };
  }

  /** Rehydrates a domain plan from a Prisma row. */
  toDomain(row: unknown): Plan {
    const data = asRow(row);
    const metadata = safeMetadata(data.metadata);
    const result = Plan.create({
      id: String(data.id),
      organizationId: String(data.organizationId),
      code: String(data.code),
      name: String(data.name),
      amountCents: Number(data.amountCents),
      currency: String(data.currency) as PlanCurrency,
      interval: String(data.interval) as PlanBillingInterval,
      features: jsonArray(data.features),
      status: data.status === "inactive" ? "inactive" : "active",
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

export const prismaPlanMapper = new PrismaPlanMapper();
