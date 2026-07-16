import type { ExecutionContext } from '../../core/context/execution.context.ts';
import { OrganizationCreateUseCase } from '../../core/entities/organization/application/organization.create.ts';
import type { OrganizationRepositoryPort } from '../../core/entities/organization/organization.repositories.ts';
import type { UserValidationQueryPort } from '../../core/entities/user/user.validation.query.port.ts';

export type OrganizationCompositionInput<OrganizationsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  organizationRepository: OrganizationRepositoryPort<OrganizationsStatus, Extra>;
  userValidationQuery: UserValidationQueryPort;
}

export class OrganizationComposition<OrganizationsStatus, Extra = unknown> {
  readonly create: OrganizationCreateUseCase<OrganizationsStatus, Extra>;

  constructor(input: OrganizationCompositionInput<OrganizationsStatus, Extra>) {
    this.create = new OrganizationCreateUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
      input.userValidationQuery
    );
  }
}
