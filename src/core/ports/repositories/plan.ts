import type { OrganizationId, Plan, PlanId } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type PlanRepositoryPort = Readonly<{
  save(plan: Plan, options?: RepositoryOperationOptions): Promise<void>;
  findById(
    organizationId: OrganizationId,
    planId: PlanId,
    options?: RepositoryOperationOptions,
  ): Promise<Plan | null>;
  findByCode(
    organizationId: OrganizationId,
    code: string,
    options?: RepositoryOperationOptions,
  ): Promise<Plan | null>;
  listByOrganizationId(
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Plan[]>;
}>;
