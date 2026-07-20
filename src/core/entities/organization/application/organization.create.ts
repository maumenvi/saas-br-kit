import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../actor/actor.validation.query.port.ts';
import { OrganizationErrors } from '../domain/organization.errors.ts';
import type { OrganizationRepositoryPort } from "../organization.repositories.ts";
import type { Organization } from "../organization.ts";


export class OrganizationCreateUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;
  private readonly actorValidationQuery: ActorValidationQueryPort;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>,
    actorValidationQuery: ActorValidationQueryPort
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
    this.actorValidationQuery = actorValidationQuery;
  }

  async execute(organization: Organization<Status, Extra>): Promise<void> {
    await this.validate(organization);
    await this.executionContext.databaseProvider.run(async () => {
      await this.organizationRepository.save(organization);
    });
  }

  async validate(organization: Organization<Status, Extra>): Promise<void> {
    organization.cnpj.validate();
    const actor = await this.actorValidationQuery.findById(organization.ownerActorId);
    if (!actor) {
      throw OrganizationErrors.organizationOwnerNotFound(organization.ownerActorId);
    }
    if (!actor.enabled) {
      throw OrganizationErrors.organizationOwnerNotEnabled(organization.ownerActorId);
    }
  }
}
