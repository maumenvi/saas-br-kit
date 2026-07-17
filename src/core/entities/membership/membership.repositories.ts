import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { MemberPermission, Membership } from './membership.ts';

export type OutputFindUserOrganizationId = {
  userId: string;
  organizationId: string;
  permissions: MemberPermission[]
}
export interface MembershipRepositoryPort<Status, Extra = unknown> extends RepositoryPort<Membership<Status, Extra>> {
  findByOrganizationId(organizationId: string): Promise<Membership<Status, Extra>[]>;
  findByUserId(userId: string): Promise<Membership<Status, Extra>[]>;
  findByUserOrganizationId(userId: string, organizationId: string): Promise<OutputFindUserOrganizationId | null>;
}
