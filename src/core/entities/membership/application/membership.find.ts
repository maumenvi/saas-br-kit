import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { MembershipRepositoryPort } from '../membership.repositories.ts';
import type { Membership } from '../membership.ts';

export class FindMembershipByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly membershipRepository: MembershipRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    membershipRepository: MembershipRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.membershipRepository = membershipRepository;
  }

  async findById(id: string): Promise<Membership<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.membershipRepository.findById(id);
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Membership<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.membershipRepository.findByOrganizationId(organizationId);
    });
  }

  async findByActorId(actorId: string): Promise<Membership<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.membershipRepository.findByActorId(actorId);
    });
  }

  async findByActorOrganizationId(actorId: string, organizationId: string): Promise<Membership<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.membershipRepository.findByActorOrganizationId(actorId, organizationId);
    });
  }
}
