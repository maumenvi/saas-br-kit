import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../actor/actor.validation.query.port.ts';
import type { OrganizationValidationQueryPort } from '../../organization/organization.validation.query.port.ts';
import { MembershipErrors } from '../domain/membership.errors.ts';
import type { MembershipRepositoryPort } from '../membership.repositories.ts';
import type { Membership } from '../membership.ts';

export class CreateMembershipUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly membershipRepository: MembershipRepositoryPort<Status, Extra>;
  private readonly actorValidationQuery: ActorValidationQueryPort;
  private readonly organizationValidationQuery: OrganizationValidationQueryPort;

  constructor(
    executionContext: ExecutionContext,
    membershipRepository: MembershipRepositoryPort<Status, Extra>,
    actorValidationQuery: ActorValidationQueryPort,
    organizationValidationQuery: OrganizationValidationQueryPort,
  ) {
    this.executionContext = executionContext;
    this.membershipRepository = membershipRepository;
    this.actorValidationQuery = actorValidationQuery;
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

    const actor = await this.actorValidationQuery.findById(membership.actorId);
    if (!actor) {
      throw MembershipErrors.actorNotFound(membership.actorId);
    }
    if (!actor.enabled) {
      throw MembershipErrors.actorNotEnabled(membership.actorId);
    }
  }
}
