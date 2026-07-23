import { ChangeOrganizationStatusUseCase } from '../../../core/entities/organization/application/organization.change.status.ts';
import type { Organization } from '../../../core/entities/organization/organization.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { OrganizationCompositionInput } from './organization.composition.input.ts';

export function composeOrganizationChangeStatus<Status, Extra = unknown>(
  input: OrganizationCompositionInput<Status, Extra>,
): Handler<Organization<Status, Extra>, void> {
  const useCase = new ChangeOrganizationStatusUseCase<Status, Extra>(
    input.executionContext,
    input.organizationRepository,
  );

  return withDefaultInterceptors(useCase.changeStatus.bind(useCase), {
    action: 'organization:change-status',
    permission: 'organization:change-status',
    ...input,
  });
}
