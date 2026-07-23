import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { VerificationRepositoryPort } from '../verification.repositories.ts';

export class ExpireVerificationsUseCase<
  MembershipStatus,
  MembershipExtra = unknown,
> {
  private readonly executionContext: ExecutionContext;
  private readonly verificationRepository: VerificationRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;

  constructor(
    executionContext: ExecutionContext,
    verificationRepository: VerificationRepositoryPort<
      MembershipStatus,
      MembershipExtra
    >,
  ) {
    this.executionContext = executionContext;
    this.verificationRepository = verificationRepository;
  }

  async execute(): Promise<number> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.verificationRepository.expirePending(this.now());
    });
  }

  private now(): Date {
    return this.executionContext.clock?.() ?? new Date();
  }
}
