import type { EntityInput } from '../../shared/input/entity.input.ts';

type BaseMembership = {
  organizationId: string;
  userId: string;
  roleId: string;
}

export type Membership<Status, Extra = unknown> = EntityInput<Status> & BaseMembership & Extra;
