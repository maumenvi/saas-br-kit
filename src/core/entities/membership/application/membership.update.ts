import type { PermissionContext } from '../../../access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';
import { MembershipErrors } from '../domain/membership.errors.ts';
import type { MembershipRepositoryPort } from '../membership.repositories.ts';
import type { Membership } from '../membership.ts';

export class UpdateMembershipUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly membershipRepository: MembershipRepositoryPort<Status, Extra>;
  private readonly permissionContext: PermissionContext;

  constructor(
    executionContext: ExecutionContext,
    membershipRepository: MembershipRepositoryPort<Status, Extra>,
    permissionContext: PermissionContext,
  ) {
    this.executionContext = executionContext;
    this.membershipRepository = membershipRepository;
    this.permissionContext = permissionContext;
  }

  async update(membership: Membership<Status, Extra>): Promise<void> {
    if (membership.actorId === this.permissionContext.actorId) {
      throw MembershipErrors.selfElevationNotAllowed(membership.actorId);
    }
    await this.executionContext.databaseProvider.run(async () => {
      await this.membershipRepository.update(membership);
    });
  }
}