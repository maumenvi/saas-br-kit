import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Membership } from './membership.ts';

export interface MembershipRepositoryPort<Status, Extra = unknown> extends RepositoryPort<Membership<Status, Extra>> {
  findByOrganizationId(organizationId: string): Promise<Membership<Status, Extra>[]>;
  findByUserId(userId: string): Promise<Membership<Status, Extra>[]>;
}
