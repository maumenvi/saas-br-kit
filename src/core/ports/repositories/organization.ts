import type { Organization, OrganizationId } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type OrganizationRepositoryPort = Readonly<{
  save(organization: Organization, options?: RepositoryOperationOptions): Promise<void>;
  findById(
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<Organization | null>;
  listByOwnerUserId?(
    ownerUserId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Organization[]>;
}>;
