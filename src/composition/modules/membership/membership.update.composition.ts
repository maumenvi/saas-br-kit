import { UpdateMembershipUseCase } from '../../../core/entities/membership/application/membership.update.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';

export function composeMembershipUpdate<Status, Extra = unknown>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<Membership<Status, Extra>, void> {
  const useCase = new UpdateMembershipUseCase(
    input.executionContext,
    input.membershipRepository,
    input.permissionContext!,
  );

  return withDefaultInterceptors(useCase.update.bind(useCase), {
    action: 'membership:update',
    permission: 'membership:update',
    ...input,
  });
}
