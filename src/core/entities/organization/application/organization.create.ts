import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { UserValidationQueryPort } from '../../user/user.validation.query.port.ts';
import { OrganizationErrors } from '../domain/organization.errors.ts';
import type { OrganizationRepositoryPort } from "../organization.repositories.ts";
import type { Organization } from "../organization.ts";


export class OrganizationCreateUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly organizationRepository: OrganizationRepositoryPort<Status, Extra>;
  private readonly userValidationQuery: UserValidationQueryPort;

  constructor(
    executionContext: ExecutionContext,
    organizationRepository: OrganizationRepositoryPort<Status, Extra>,
    userValidationQuery: UserValidationQueryPort
  ) {
    this.executionContext = executionContext;
    this.organizationRepository = organizationRepository;
    this.userValidationQuery = userValidationQuery;
  }

  async execute(organization: Organization<Status, Extra>): Promise<void> {
    await this.validate(organization);
    await this.executionContext.databaseProvider.run(async () => {
      await this.organizationRepository.save(organization);
    });
  }

  async validate(organization: Organization<Status, Extra>): Promise<void> {
    organization.cnpj.validate();
    if (await this.userValidationQuery.findById(organization.ownerUserId) === null) {
      throw OrganizationErrors.organizationOwnerInvalid(organization.ownerUserId);
    }
  }
}
