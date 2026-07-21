import type { ActorStatusPolicyPort } from '../core/entities/actor/policies/actor.status.police.ts';
import type { OrganizationStatusPolicyPort } from '../core/entities/organization/policies/organizations.status.police.ts';
import type { OrganizationSlugPolicyPort } from '../core/entities/organization/policies/organization.slug.policy.ts';

export type Status = "active" | "inactive" | "pending" | "suspended";

export class PolicyActor implements ActorStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean {
    return status === "active";
  }
}

export class PolicyOrganization implements OrganizationStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean {
    return status === "active";
  }
}

export const RESERVED_ORGANIZATION_SLUGS = [
  'admin',
  'api',
  'auth',
  'www',
] as const;

export class PolicyOrganizationSlug implements OrganizationSlugPolicyPort {
  isReserved(slug: string): boolean {
    return RESERVED_ORGANIZATION_SLUGS.some((reserved) => reserved === slug);
  }
}
