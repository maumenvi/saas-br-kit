import { ChangeMembershipStatusUseCase } from '../../../core/entities/membership/application/membership.changeStatus.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';

export function composeMembershipChangeStatus<Status, Extra = unknown>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<Membership<Status, Extra>, void> {
  const useCase = new ChangeMembershipStatusUseCase(
    input.executionContext,
    input.membershipRepository,
  );

  return withDefaultInterceptors(useCase.changeStatus.bind(useCase), {
    action: 'membership:change-status',
    permission: 'membership:change-status',
    ...input,
  });
}
