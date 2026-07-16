import type { EntityInput } from '../../shared/input/entity.input.ts';
import type { PermissionKey } from '../../access-control/permission.catalog.ts';

export type MemberPermissionOverride = {
  id: string;
  membershipId: string;
  permission: PermissionKey;
  effect: 'allow' | 'deny';
  createdAt: Date;
  createdByUserId: string;
};

type BaseMembership = {
  organizationId: string;
  userId: string;
  roleId: string;
  permissionsOverrides?: MemberPermissionOverride[];
};

export type Membership<Status, Extra = unknown> = EntityInput<Status> & BaseMembership & Extra;
