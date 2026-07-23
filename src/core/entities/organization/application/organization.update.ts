import { ExecutionContext } from '../../../context/execution.context.ts';
import type { OrganizationRepositoryPort } from "../organization.repositories.ts";
import type { Organization } from "../organization.ts";
import { OrganizationErrors } from '../domain/organization.errors.ts';
import type { OrganizationSlugPolicyPort } from '../policies/organization.slug.policy.ts';

export class UpdateOrganizationUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;
  private readonly organizationSlugPolicy: OrganizationSlugPolicyPort;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>,
    organizationSlugPolicy: OrganizationSlugPolicyPort,
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
    this.organizationSlugPolicy = organizationSlugPolicy;
  }

  async update(organization: Organization<Status, Extra>): Promise<void> {
    const organizationSnapshot = Object.freeze({
      ...organization,
      slug: organization.slug,
    }) as Organization<Status, Extra>;

    organizationSnapshot.cnpj.validate();
    organizationSnapshot.slug.validate();
    if (this.organizationSlugPolicy.isReserved(organizationSnapshot.slug.value)) {
      throw OrganizationErrors.reservedSlug(organizationSnapshot.slug.value);
    }

    await this.executionContext.databaseProvider.run(async () => {
      const existingOrganization = await this.organizationRepository.findBySlug(organizationSnapshot.slug.value);
      if (existingOrganization && existingOrganization.id !== organizationSnapshot.id) {
        throw OrganizationErrors.slugAlreadyExists(organizationSnapshot.slug.value);
      }
      await this.organizationRepository.update(organizationSnapshot);
    });
  }
}
