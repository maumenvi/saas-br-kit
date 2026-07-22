import { FindOrganizationByIdUseCase } from '../../../core/entities/organization/application/organization.find.ts';
import type { Organization } from '../../../core/entities/organization/organization.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { OrganizationCompositionInput } from './organization.composition.input.ts';

export function composeOrganizationFindById<Status, Extra = unknown>(
  input: OrganizationCompositionInput<Status, Extra>,
): Handler<string, Organization<Status, Extra> | null> {
  const useCase = new FindOrganizationByIdUseCase<Status, Extra>(
    input.executionContext,
    input.organizationRepository,
  );

  return withDefaultInterceptors(useCase.findById.bind(useCase), {
    action: 'organization:find-by-id',
    permission: 'organization:find',
    ...input,
  });
}

export function composeOrganizationFindByCnpj<Status, Extra = unknown>(
  input: OrganizationCompositionInput<Status, Extra>,
): Handler<string, Organization<Status, Extra> | null> {
  const useCase = new FindOrganizationByIdUseCase<Status, Extra>(
    input.executionContext,
    input.organizationRepository,
  );

  return withDefaultInterceptors(useCase.findByCnpj.bind(useCase), {
    action: 'organization:find-by-cnpj',
    permission: 'organization:find',
    ...input,
  });
}

export function composeOrganizationFindBySlug<Status, Extra = unknown>(
  input: OrganizationCompositionInput<Status, Extra>,
): Handler<string, Organization<Status, Extra> | null> {
  const useCase = new FindOrganizationByIdUseCase<Status, Extra>(
    input.executionContext,
    input.organizationRepository,
  );

  return withDefaultInterceptors(useCase.findBySlug.bind(useCase), {
    action: 'organization:find-by-slug',
    permission: 'organization:find',
    ...input,
  });
}
