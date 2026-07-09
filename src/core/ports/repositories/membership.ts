import type { Membership, MembershipId, OrganizationId } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type FindMembershipByOrganizationAndUserInput = Readonly<{
  organizationId: OrganizationId;
  userId: string;
}>;

export type MembershipRepositoryPort = Readonly<{
  save(membership: Membership, options?: RepositoryOperationOptions): Promise<void>;
  findById(
    membershipId: MembershipId,
    options?: RepositoryOperationOptions,
  ): Promise<Membership | null>;
  findByOrganizationIdAndUserId(
    input: FindMembershipByOrganizationAndUserInput,
    options?: RepositoryOperationOptions,
  ): Promise<Membership | null>;
  listByUserId(
    userId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Membership[]>;
  listByOrganizationId(
    organizationId: OrganizationId,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Membership[]>;
}>;
