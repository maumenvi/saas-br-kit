import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { MembershipRepositoryPort } from '../membership.repositories.ts';
import type { Membership } from '../membership.ts';

export class CreateMembershipUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly membershipRepository: MembershipRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    membershipRepository: MembershipRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.membershipRepository = membershipRepository;
  }

  async execute(membership: Membership<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.membershipRepository.save(membership);
    });
  }
}