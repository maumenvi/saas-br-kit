import { ExecutionContext } from "../../../context/execution.context.ts";
import type { OrganizationRepositoryPort } from "../../organization.repositories.ts";
import type { Organization } from "../organization.input.ts";

export class ChangeOrganizationStatusUseCase<Status> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status>;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status>
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
  }

  async changeStatus(organization: Organization<Status>): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.organizationRepository.changeStatus(organization);
    });
  }
}
