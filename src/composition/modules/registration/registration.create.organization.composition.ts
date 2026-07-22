import { RegisterOrganizationUseCase } from '../../../core/entities/organization/application/organization.register.ts';
import type {
  OrganizationRegistrationInput,
  OrganizationRegistrationOutput,
} from '../../../core/entities/organization/application/organization.registration.input.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { RegistrationCompositionInput } from './registration.composition.input.ts';

export function composeRegistrationCreateOrganization<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
>(
  input: RegistrationCompositionInput<
    ActorStatus,
    OrganizationStatus,
    MembershipStatus,
    ActorExtra,
    OrganizationExtra,
    MembershipExtra
  >,
): Handler<
  OrganizationRegistrationInput<
    ActorStatus,
    OrganizationStatus,
    MembershipStatus,
    ActorExtra,
    OrganizationExtra,
    MembershipExtra
  >,
  OrganizationRegistrationOutput
> {
  const useCase = new RegisterOrganizationUseCase({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    organizationRepository: input.organizationRepository,
    membershipRepository: input.membershipRepository,
    policy: input.policy,
  });

  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'registration:create-organization',
    executionContext: input.executionContext,
    auditRepository: input.auditRepository,
    identityResolver: (_registration, output) => ({
      actorId: output?.actorId ?? null,
      organizationId: output?.organizationId ?? null,
      membershipId: output?.membershipId ?? null,
    }),
  });
}
