import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { OrganizationValidationQueryPort } from '../../organization/organization.validation.query.port.ts';
import type { UserValidationQueryPort } from '../../user/user.validation.query.port.ts';
import { MembershipErrors } from '../domain/membership.errors.ts';
import type { MembershipRepositoryPort } from '../membership.repositories.ts';
import type { Membership } from '../membership.ts';

export class CreateMembershipUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly membershipRepository: MembershipRepositoryPort<Status, Extra>;
  private readonly userValidationQuery: UserValidationQueryPort;
  private readonly organizationValidationQuery: OrganizationValidationQueryPort;

  constructor(
    executionContext: ExecutionContext,
    membershipRepository: MembershipRepositoryPort<Status, Extra>,
    userValidationQuery: UserValidationQueryPort,
    organizationValidationQuery: OrganizationValidationQueryPort,
  ) {
    this.executionContext = executionContext;
    this.membershipRepository = membershipRepository;
    this.userValidationQuery = userValidationQuery;
    this.organizationValidationQuery = organizationValidationQuery;
  }

  async execute(membership: Membership<Status, Extra>): Promise<void> {
    await this.validate(membership);
    await this.executionContext.databaseProvider.run(async () => {
      await this.membershipRepository.save(membership);
    });
  }

  async validate(membership: Membership<Status, Extra>): Promise<void> {
    const organization = await this.organizationValidationQuery.findById(membership.organizationId);
    if (!organization) {
      throw MembershipErrors.organizationNotFound(membership.organizationId);
    }
    if (!organization.enabled) {
      throw MembershipErrors.organizationNotEnabled(membership.organizationId);
    }

    const user = await this.userValidationQuery.findById(membership.userId);
    if (!user) {
      throw MembershipErrors.userNotFound(membership.userId);
    }
    if (!user.enabled) {
      throw MembershipErrors.userNotEnabled(membership.userId);
    }
  }
}
