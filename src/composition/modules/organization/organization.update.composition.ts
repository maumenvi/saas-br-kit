import { UpdateOrganizationUseCase } from '../../../core/entities/organization/application/organization.update.ts';
import type { Organization } from '../../../core/entities/organization/organization.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { OrganizationCompositionInput } from './organization.composition.input.ts';

export function composeOrganizationUpdate<Status, Extra = unknown>(
  input: OrganizationCompositionInput<Status, Extra>,
): Handler<Organization<Status, Extra>, void> {
  const useCase = new UpdateOrganizationUseCase<Status, Extra>(
    input.executionContext,
    input.organizationRepository,
    input.policy.organizationSlugPolicy,
  );

  return withDefaultInterceptors(useCase.update.bind(useCase), {
    action: 'organization:update',
    permission: 'organization:update',
    ...input,
  });
}
