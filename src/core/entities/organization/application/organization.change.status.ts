import { ExecutionContext } from '../../../context/execution.context.ts';
import type { OrganizationRepositoryPort } from "../organization.repositories.ts";
import type { Organization } from "../organization.ts";

export class ChangeOrganizationStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
  }

  async changeStatus(organization: Organization<Status, Extra>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.organizationRepository.changeStatus(organization);
    });
  }
}
