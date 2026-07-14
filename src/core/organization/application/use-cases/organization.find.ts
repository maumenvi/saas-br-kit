import { ExecutionContext } from "../../../context/execution.context.ts";
import type { OrganizationRepositoryPort } from "../../organization.repositories.ts";
import type { Organization } from "../organization.input.ts";

export class FindOrganizationByIdUseCase<Status> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status>;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status>
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
  }

  async findById(id: string): Promise<Organization<Status> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.organizationRepository.findById(id);
    });
  }

  async findByCnpj(cnpj: string): Promise<Organization<Status> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.organizationRepository.findByCnpj(cnpj);
    });
  }
}
