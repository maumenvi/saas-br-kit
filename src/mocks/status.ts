import type { OrganizationStatusPolicyPort } from '../core/entities/organization/policies/organizations.status.police.ts';
import type { UserStatusPolicyPort } from '../core/entities/user/policies/user.status.police.ts';

export type Status = "active" | "inactive" | "pending" | "suspended";

export class PolicyUser implements UserStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean {
    return status === "active";
  }
}

export class PolicyOrganization implements OrganizationStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean {
    return status === "active";
  }
}
