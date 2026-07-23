import { ExecutionContext } from '../../../context/execution.context.ts';
import type { OrganizationRepositoryPort } from "../organization.repositories.ts";
import type { Organization } from "../organization.ts";
import { OrganizationSlug } from '../domain/organization.slug.ts';

export class FindOrganizationByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
  }

  async findById(id: string): Promise<Organization<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.organizationRepository.findById(id);
    });
  }

  async findByCnpj(cnpj: string): Promise<Organization<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      return await this.organizationRepository.findByCnpj(cnpj);
    });
  }

  async findBySlug(slug: string): Promise<Organization<Status, Extra> | null> {
    const normalizedSlug = new OrganizationSlug(slug);
    normalizedSlug.validate();

    return await this.executionContext.databaseProvider.run(async () => {
      return await this.organizationRepository.findBySlug(normalizedSlug.value);
    });
  }
}
