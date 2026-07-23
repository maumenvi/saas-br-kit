import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../actor/actor.validation.query.port.ts';
import { OrganizationErrors } from '../domain/organization.errors.ts';
import type { OrganizationRepositoryPort } from "../organization.repositories.ts";
import type { Organization } from "../organization.ts";
import type { OrganizationSlugPolicyPort } from '../policies/organization.slug.policy.ts';


export class OrganizationCreateUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;
  private readonly actorValidationQuery: ActorValidationQueryPort;
  private readonly organizationSlugPolicy: OrganizationSlugPolicyPort;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>,
    actorValidationQuery: ActorValidationQueryPort,
    organizationSlugPolicy: OrganizationSlugPolicyPort,
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
    this.actorValidationQuery = actorValidationQuery;
    this.organizationSlugPolicy = organizationSlugPolicy;
  }

  async execute(organization: Organization<Status, Extra>): Promise<void> {
    const organizationSnapshot = Object.freeze({
      ...organization,
      slug: organization.slug,
    }) as Organization<Status, Extra>;

    await this.validate(organizationSnapshot);
    await this.executionContext.databaseProvider.run(async () => {
      const existingOrganization = await this.organizationRepository.findBySlug(organizationSnapshot.slug.value);

      if (existingOrganization) {
        throw OrganizationErrors.slugAlreadyExists(organizationSnapshot.slug.value);
      }

      await this.organizationRepository.save(organizationSnapshot);
    });
  }

  async validate(organization: Organization<Status, Extra>): Promise<void> {
    organization.cnpj.validate();
    organization.slug.validate();
    if (this.organizationSlugPolicy.isReserved(organization.slug.value)) {
      throw OrganizationErrors.reservedSlug(organization.slug.value);
    }
    const actor = await this.actorValidationQuery.findById(organization.ownerActorId);
    if (!actor) {
      throw OrganizationErrors.organizationOwnerNotFound(organization.ownerActorId);
    }
    if (!actor.enabled) {
      throw OrganizationErrors.organizationOwnerNotEnabled(organization.ownerActorId);
    }
  }
}
