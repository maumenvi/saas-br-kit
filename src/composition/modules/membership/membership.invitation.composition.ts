import { RequestMembershipInvitationUseCase } from '../../../core/entities/membership/application/membership.invitation.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { RequestVerificationOutput } from '../../../core/entities/verification/application/verification.request.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';

export function composeMembershipRequestOrganizationInvitation<
  Status,
  Extra = unknown,
>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<Membership<Status, Extra>, RequestVerificationOutput> {
  const useCase = new RequestMembershipInvitationUseCase({
    executionContext: input.executionContext,
    membershipRepository: input.membershipRepository,
    verificationRepository: input.verificationRepository,
    verification: input.verification,
    actorValidationQuery: input.actorValidationQuery,
    organizationValidationQuery: input.organizationValidationQuery,
  });
  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'membership:request-organization-invitation',
    permission: 'membership:create',
    idempotent: false,
    ...input,
  });
}
