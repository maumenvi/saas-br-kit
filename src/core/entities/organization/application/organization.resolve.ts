import type { ExecutionContext } from '../../../context/execution.context.ts';
import { OrganizationSlug } from '../domain/organization.slug.ts';
import { OrganizationErrors } from '../domain/organization.errors.ts';
import type { OrganizationRepositoryPort } from '../organization.repositories.ts';
import type { OrganizationSlugPolicyPort } from '../policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../policies/organizations.status.police.ts';

export type ResolvedOrganizationTenant = Readonly<{
  organizationId: string;
  slug: string;
}>;

export class ResolveOrganizationTenantUseCase<Status> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: Pick<
    OrganizationRepositoryPort<Status, unknown>,
    'findBySlug'
  >;
  private readonly organizationStatusPolicy: OrganizationStatusPolicyPort<Status>;
  private readonly organizationSlugPolicy: OrganizationSlugPolicyPort;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: Pick<
      OrganizationRepositoryPort<Status, unknown>,
      'findBySlug'
    >,
    organizationStatusPolicy: OrganizationStatusPolicyPort<Status>,
    organizationSlugPolicy: OrganizationSlugPolicyPort,
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
    this.organizationStatusPolicy = organizationStatusPolicy;
    this.organizationSlugPolicy = organizationSlugPolicy;
  }

  async resolve(slugInput: string): Promise<ResolvedOrganizationTenant | null> {
    const slug = new OrganizationSlug(slugInput);
    slug.validate();

    if (this.organizationSlugPolicy.isReserved(slug.value)) {
      throw OrganizationErrors.reservedSlug(slug.value);
    }

    return await this.executionContext.databaseProvider.run(async () => {
      const organization = await this.organizationRepository.findBySlug(slug.value);

      if (
        !organization ||
        !this.organizationStatusPolicy.isEnabled(organization.status)
      ) {
        return null;
      }

      return Object.freeze({
        organizationId: organization.id,
        slug: organization.slug.value,
      });
    });
  }
}
