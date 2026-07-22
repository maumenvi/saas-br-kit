import { ChangeOrganizationStatusUseCase } from '../../../core/entities/organization/application/organization.change.status.ts';
import { OrganizationCreateUseCase } from '../../../core/entities/organization/application/organization.create.ts';
import { FindOrganizationByIdUseCase } from '../../../core/entities/organization/application/organization.find.ts';
import { UpdateOrganizationUseCase } from '../../../core/entities/organization/application/organization.update.ts';
import type { Organization } from '../../../core/entities/organization/organization.ts';
import type { OrganizationValidationQueryPort } from '../../../core/entities/organization/organization.validation.query.port.ts';
import { OrganizationDataValidationService } from '../../../core/entities/organization/services/organization.data.validation.service.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { OrganizationCompositionInput } from './organization.composition.input.ts';

export class OrganizationComposition<OrganizationsStatus, Extra = unknown> {
  readonly create: Handler<Organization<OrganizationsStatus, Extra>, void>;
  readonly update: Handler<Organization<OrganizationsStatus, Extra>, void>;
  readonly changeStatus: Handler<Organization<OrganizationsStatus, Extra>, void>;
  readonly findById: Handler<
    string,
    Organization<OrganizationsStatus, Extra> | null
  >;
  readonly findByCnpj: Handler<
    string,
    Organization<OrganizationsStatus, Extra> | null
  >;
  readonly findBySlug: Handler<
    string,
    Organization<OrganizationsStatus, Extra> | null
  >;
  readonly validationQuery: OrganizationValidationQueryPort;
  readonly logger: LoggerPort;

  constructor(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ) {
    this.logger = input.executionContext.loggerProvider;
    this.create = this.composeCreate(input);
    this.update = this.composeUpdate(input);
    this.changeStatus = this.composeChangeStatus(input);
    this.findById = this.composeFindById(input);
    this.findByCnpj = this.composeFindByCnpj(input);
    this.findBySlug = this.composeFindBySlug(input);

    this.validationQuery = new OrganizationDataValidationService(
      input.organizationRepository,
      input.policy.organizationStatusPolicy,
    );
  }

  private composeCreate(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ): Handler<Organization<OrganizationsStatus, Extra>, void> {
    const useCase = new OrganizationCreateUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
      input.actorValidationQuery,
      input.policy.organizationSlugPolicy,
    );

    return withDefaultInterceptors(useCase.execute.bind(useCase), {
      action: 'organization:create',
      permission: 'organization:create',
      ...input,
    });
  }

  private composeUpdate(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ): Handler<Organization<OrganizationsStatus, Extra>, void> {
    const useCase = new UpdateOrganizationUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
      input.policy.organizationSlugPolicy,
    );

    return withDefaultInterceptors(useCase.update.bind(useCase), {
      action: 'organization:update',
      permission: 'organization:update',
      ...input,
    });
  }

  private composeChangeStatus(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ): Handler<Organization<OrganizationsStatus, Extra>, void> {
    const useCase = new ChangeOrganizationStatusUseCase<
      OrganizationsStatus,
      Extra
    >(input.executionContext, input.organizationRepository);

    return withDefaultInterceptors(useCase.changeStatus.bind(useCase), {
      action: 'organization:change-status',
      permission: 'organization:change-status',
      ...input,
    });
  }

  private composeFindById(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ): Handler<string, Organization<OrganizationsStatus, Extra> | null> {
    const useCase = new FindOrganizationByIdUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
    );

    return withDefaultInterceptors(useCase.findById.bind(useCase), {
      action: 'organization:find-by-id',
      permission: 'organization:find',
      ...input,
    });
  }

  private composeFindByCnpj(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ): Handler<string, Organization<OrganizationsStatus, Extra> | null> {
    const useCase = new FindOrganizationByIdUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
    );

    return withDefaultInterceptors(useCase.findByCnpj.bind(useCase), {
      action: 'organization:find-by-cnpj',
      permission: 'organization:find',
      ...input,
    });
  }

  private composeFindBySlug(
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
  ): Handler<string, Organization<OrganizationsStatus, Extra> | null> {
    const useCase = new FindOrganizationByIdUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
    );

    return withDefaultInterceptors(useCase.findBySlug.bind(useCase), {
      action: 'organization:find-by-slug',
      permission: 'organization:find',
      ...input,
    });
  }
}
