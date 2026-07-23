import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../actor/actor.validation.query.port.ts';
import { ActorErrors } from '../../actor/domain/actor.errors.ts';
import type { OrganizationValidationQueryPort } from '../../organization/organization.validation.query.port.ts';
import {
  RequestVerificationUseCase,
  type RequestVerificationOutput,
} from '../../verification/application/verification.request.ts';
import type { VerificationConfig } from '../../verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../verification/verification.repositories.ts';
import { MembershipErrors } from '../domain/membership.errors.ts';
import type { MembershipRepositoryPort } from '../membership.repositories.ts';
import type { Membership } from '../membership.ts';

export type RequestMembershipInvitationUseCaseInput<Status, Extra = unknown> = {
  executionContext: ExecutionContext;
  membershipRepository: MembershipRepositoryPort<Status, Extra>;
  verificationRepository: VerificationRepositoryPort<Status, Extra>;
  verification: VerificationConfig;
  actorValidationQuery: ActorValidationQueryPort;
  organizationValidationQuery: OrganizationValidationQueryPort;
};

export class RequestMembershipInvitationUseCase<Status, Extra = unknown> {
  private readonly input: RequestMembershipInvitationUseCaseInput<Status, Extra>;
  private readonly requestVerification: RequestVerificationUseCase<Status, Extra>;

  constructor(input: RequestMembershipInvitationUseCaseInput<Status, Extra>) {
    this.input = input;
    this.requestVerification = new RequestVerificationUseCase({
      executionContext: input.executionContext,
      verificationRepository: input.verificationRepository,
      config: input.verification,
    });
  }

  async execute(
    membership: Membership<Status, Extra>,
  ): Promise<RequestVerificationOutput> {
    const organization = await this.input.organizationValidationQuery.findById(
      membership.organizationId,
    );
    if (!organization) {
      throw MembershipErrors.organizationNotFound(membership.organizationId);
    }
    if (!organization.enabled) {
      throw MembershipErrors.organizationNotEnabled(membership.organizationId);
    }

    const actor = await this.input.actorValidationQuery.findById(membership.actorId);
    if (!actor) throw MembershipErrors.actorNotFound(membership.actorId);
    if (!actor.enabled) throw MembershipErrors.actorNotEnabled(membership.actorId);
    if (actor.type !== 'USER' || !actor.email) {
      throw ActorErrors.notificationRequiresUser(membership.actorId);
    }

    const existing = await this.input.executionContext.databaseProvider.run(
      async () => await this.input.membershipRepository.findByActorOrganizationId(
        membership.actorId,
        membership.organizationId,
      ),
    );
    if (existing) {
      throw MembershipErrors.alreadyExists(
        membership.actorId,
        membership.organizationId,
      );
    }

    return await this.requestVerification.execute({
      purpose: 'ORGANIZATION_INVITATION',
      actorId: membership.actorId,
      organizationId: membership.organizationId,
      destination: actor.email,
      membership,
    });
  }
}
