import type { OrganizationStatusPolicyPort } from '../policies/organizations.status.police.ts';
import type { OrganizationRepositoryPort } from '../organization.repositories.ts';
import type { OrganizationValidationQueryPort } from '../organization.validation.query.port.ts';

export class OrganizationDataValidationService<Status> implements OrganizationValidationQueryPort {
  private readonly organizationRepository: Pick<OrganizationRepositoryPort<Status, unknown>, 'findById'>;
  private readonly organizationStatusPolicy: OrganizationStatusPolicyPort<Status>;

  constructor(
    organizationRepository: Pick<OrganizationRepositoryPort<Status, unknown>, 'findById'>,
    organizationStatusPolicy: OrganizationStatusPolicyPort<Status>
  ) {
    this.organizationRepository = organizationRepository;
    this.organizationStatusPolicy = organizationStatusPolicy;
  }

  async findById(id: string): Promise<{
    id: string;
    enabled: boolean;
  } | null> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) return null;

    return {
      id: organization.id,
      enabled: this.organizationStatusPolicy.isEnabled(organization.status),
    };
  }
}
