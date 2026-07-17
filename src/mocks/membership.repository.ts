import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type { MembershipRepositoryPort, OutputFindUserOrganizationId } from '../core/entities/membership/membership.repositories.ts';
import type { Membership } from '../core/entities/membership/membership.ts';
import type { Status } from './status.ts';

export class MembershipRepositoryMock implements MembershipRepositoryPort<Status, RepositoriesExtra['memberships']> {
  async findByUserOrganizationId(userId: string, organizationId: string): Promise<OutputFindUserOrganizationId | null> {
    const membership = await Promise.resolve(this.memberships.find((membership) => membership.userId === userId && membership.organizationId === organizationId) ?? null);
    if (!membership) return null;
    return {
      userId: membership.userId,
      organizationId: membership.organizationId,
      permissions: membership.permissions ?? [],
    };
  }
  readonly memberships: Membership<Status>[] = [];

  save(membership: Membership<Status>): Promise<void> {
    this.memberships.push(membership);
    return Promise.resolve();
  }

  update(membership: Membership<Status>): Promise<void> {
    const index = this.memberships.findIndex((current) => current.id === membership.id);
    if (index !== -1) this.memberships[index] = membership;
    return Promise.resolve();
  }

  changeStatus(membership: Membership<Status>): Promise<void> {
    const current = this.memberships.find((item) => item.id === membership.id);
    if (current) current.status = 'inactive';
    return Promise.resolve();
  }

  findById(id: string): Promise<Membership<Status> | null> {
    return Promise.resolve(this.memberships.find((membership) => membership.id === id) ?? null);
  }

  findByOrganizationId(organizationId: string): Promise<Membership<Status>[]> {
    return Promise.resolve(
      this.memberships.filter((membership) => membership.organizationId === organizationId),
    );
  }

  findByUserId(userId: string): Promise<Membership<Status>[]> {
    return Promise.resolve(
      this.memberships.filter((membership) => membership.userId === userId),
    );
  }
}
