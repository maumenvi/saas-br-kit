import { CreateMembershipUseCase } from '../../../core/entities/membership/application/membership.create.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';

export function composeMembershipCreate<Status, Extra = unknown>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<Membership<Status, Extra>, void> {
  const useCase = new CreateMembershipUseCase(
    input.executionContext,
    input.membershipRepository,
    input.actorValidationQuery,
    input.organizationValidationQuery,
  );

  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'membership:create',
    permission: 'membership:create',
    ...input,
  });
}
