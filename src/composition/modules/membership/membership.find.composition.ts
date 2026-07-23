import { FindMembershipByIdUseCase } from '../../../core/entities/membership/application/membership.find.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';

export function composeMembershipFindById<Status, Extra = unknown>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<string, Membership<Status, Extra> | null> {
  const useCase = new FindMembershipByIdUseCase(
    input.executionContext,
    input.membershipRepository,
  );

  return withDefaultInterceptors(useCase.findById.bind(useCase), {
    action: 'membership:find-by-id',
    permission: 'membership:find',
    ...input,
  });
}

export function composeMembershipFindByOrganizationId<
  Status,
  Extra = unknown,
>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<string, Membership<Status, Extra>[]> {
  const useCase = new FindMembershipByIdUseCase(
    input.executionContext,
    input.membershipRepository,
  );

  return withDefaultInterceptors(
    useCase.findByOrganizationId.bind(useCase),
    {
      action: 'membership:find-by-organization-id',
      permission: 'membership:find',
      ...input,
    },
  );
}

export function composeMembershipFindByActorId<Status, Extra = unknown>(
  input: MembershipCompositionInput<Status, Extra>,
): Handler<string, Membership<Status, Extra>[]> {
  const useCase = new FindMembershipByIdUseCase(
    input.executionContext,
    input.membershipRepository,
  );

  return withDefaultInterceptors(useCase.findByActorId.bind(useCase), {
    action: 'membership:find-by-actor-id',
    permission: 'membership:find',
    ...input,
  });
}
