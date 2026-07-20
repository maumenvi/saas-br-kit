import type { EntityInput } from '../../shared/input/entity.input.ts';
import type { PermissionKey } from '../../access-control/permission.catalog.ts';

export type MemberPermission = {
  id: string;
  membershipId: string;
  permission: PermissionKey;
  effect: 'allow' | 'deny';
  createdAt: Date;
  createdByActorId: string;
};

type BaseMembership = {
  organizationId: string;
  actorId: string;
  role: string;
  permissions: MemberPermission[];
};

export type Membership<Status, Extra = unknown> = EntityInput<Status> & BaseMembership & Extra;
