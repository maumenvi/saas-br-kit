import { OrganizationCreateUseCase } from '../../../core/entities/organization/application/organization.create.ts';
import type { Organization } from '../../../core/entities/organization/organization.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { OrganizationCompositionInput } from './organization.composition.input.ts';

export function composeOrganizationCreate<Status, Extra = unknown>(
  input: OrganizationCompositionInput<Status, Extra>,
): Handler<Organization<Status, Extra>, void> {
  const useCase = new OrganizationCreateUseCase<Status, Extra>(
    input.executionContext,
    input.organizationRepository,
    input.actorValidationQuery,
    input.policy.organizationSlugPolicy,
  );

  return withDefaultInterceptors(useCase.execute.bind(useCase), {
    action: 'organization:create',
    permission: 'organization:create',
    ...input,
  });
}
