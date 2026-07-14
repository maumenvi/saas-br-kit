import { ExecutionContext } from "../../../context/execution.context.ts";
import type { OrganizationRepositoryPort } from "../../organization.repositories.ts";
import type { Organization } from "../organization.input.ts";

export class UpdateOrganizationUseCase<Status> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status>;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status>
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
  }

  async update(organization: Organization<Status>): Promise<void> {
    organization.cnpj.validate();

    await this.executionContext.databaseProvider.run(async () => {
      await this.organizationRepository.update(organization);
    });
  }
}
