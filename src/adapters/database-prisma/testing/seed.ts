import { Organization, Plan } from "#core";
import type { PrismaBillingRepositories } from "../repositories/index.ts";

export type SeedPrismaBillingSliceInput = Readonly<{
  repositories: Pick<PrismaBillingRepositories, "organizations" | "plans">;
  now?: string;
}>;

/** Seeds the minimum organization and plan records used by adapter tests and demos. */
export async function seedPrismaBillingSlice(input: SeedPrismaBillingSliceInput): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  const organization = Organization.create({
    id: "org_seed",
    ownerUserId: "user_seed",
    name: "Seed Organization",
    createdAt: now,
  });
  const plan = Plan.create({
    id: "plan_seed",
    organizationId: "org_seed",
    code: "seed",
    name: "Seed Plan",
    amountCents: 9900,
    interval: "monthly",
    createdAt: now,
  });

  if (!organization.ok) {
    throw new Error(organization.error.message);
  }
  if (!plan.ok) {
    throw new Error(plan.error.message);
  }

  await input.repositories.organizations.save(organization.data);
  await input.repositories.plans.save(plan.data);
}
