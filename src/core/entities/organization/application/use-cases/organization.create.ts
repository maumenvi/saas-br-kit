import type { ExecutionContext } from '../../../../context/execution.context.ts';
import type { OrganizationRepositoryPort } from "../../organization.repositories.ts";
import type { Organization } from "../organization.input.ts";


export class OrganizationCreateUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
  }

  async execute(organization: Organization<Status, Extra>): Promise<void> {
    organization.cnpj.validate();

    await this.executionContext.databaseProvider.run(async () => {
      await this.organizationRepository.save(organization);
    });
  }
}
