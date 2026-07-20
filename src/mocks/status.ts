import type { ActorStatusPolicyPort } from '../core/entities/actor/policies/actor.status.police.ts';
import type { OrganizationStatusPolicyPort } from '../core/entities/organization/policies/organizations.status.police.ts';

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
