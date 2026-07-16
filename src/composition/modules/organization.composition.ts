import type { ExecutionContext } from '../../core/context/execution.context.ts';
import { OrganizationCreateUseCase } from '../../core/organization/application/use-cases/organization.create.ts';
import type { OrganizationRepositoryPort } from '../../core/organization/organization.repositories.ts';

export type OrganizationCompositionInput<OrganizationsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  organizationRepository: OrganizationRepositoryPort<OrganizationsStatus, Extra>;
}

export class OrganizationComposition<OrganizationsStatus, Extra = unknown> {
  readonly create: OrganizationCreateUseCase<OrganizationsStatus>;

  constructor(input: OrganizationCompositionInput<OrganizationsStatus, Extra>) {
    this.create = new OrganizationCreateUseCase<OrganizationsStatus>(
      input.executionContext,
      input.organizationRepository
    )
  }
}
