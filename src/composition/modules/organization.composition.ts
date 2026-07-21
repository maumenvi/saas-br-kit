import type { ExecutionContext } from '../../core/context/execution.context.ts';
import { PermissionIntercept, type PermissionContext } from '../../core/access-control/permission.intercept.ts';
import type { PermissionKey } from '../../core/access-control/permission.catalog.ts';
import type { ActorValidationQueryPort } from '../../core/entities/actor/actor.validation.query.port.ts';
import { ChangeOrganizationStatusUseCase } from '../../core/entities/organization/application/organization.change.status.ts';
import { OrganizationCreateUseCase } from '../../core/entities/organization/application/organization.create.ts';
import { FindOrganizationByIdUseCase } from '../../core/entities/organization/application/organization.find.ts';
import { UpdateOrganizationUseCase } from '../../core/entities/organization/application/organization.update.ts';
import type { Organization } from '../../core/entities/organization/organization.ts';
import type { OrganizationRepositoryPort } from '../../core/entities/organization/organization.repositories.ts';
import type { OrganizationValidationQueryPort } from '../../core/entities/organization/organization.validation.query.port.ts';
import type { OrganizationStatusPolicyPort } from '../../core/entities/organization/policies/organizations.status.police.ts';
import { OrganizationDataValidationService } from '../../core/entities/organization/services/organization.data.validation.service.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type OrganizationCompositionInput<OrganizationsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  organizationRepository: OrganizationRepositoryPort<OrganizationsStatus, Extra>;
  actorValidationQuery: ActorValidationQueryPort;
  policy: {
    organizationStatusPolicy: OrganizationStatusPolicyPort<OrganizationsStatus>;
  };
  permissionContext?: PermissionContext;
}

export class OrganizationComposition<OrganizationsStatus, Extra = unknown> {
  readonly create: Handler<Organization<OrganizationsStatus, Extra>, void>;
  readonly update: Handler<Organization<OrganizationsStatus, Extra>, void>;
  readonly changeStatus: Handler<Organization<OrganizationsStatus, Extra>, void>;
  readonly findById: Handler<string, Organization<OrganizationsStatus, Extra> | null>;
  readonly findByCnpj: Handler<string, Organization<OrganizationsStatus, Extra> | null>;
  readonly validationQuery: OrganizationValidationQueryPort;
  readonly logger: LoggerPort;

  constructor(input: OrganizationCompositionInput<OrganizationsStatus, Extra>) {
    this.logger = input.executionContext.loggerProvider;
    this.create = this.composeCreate(input);
    this.update = this.composeUpdate(input);
    this.changeStatus = this.composeChangeStatus(input);
    this.findById = this.composeFindById(input);
    this.findByCnpj = this.composeFindByCnpj(input);

    this.validationQuery = new OrganizationDataValidationService(
      input.organizationRepository,
      input.policy.organizationStatusPolicy
    );
  }

  private composeCreate(input: OrganizationCompositionInput<OrganizationsStatus, Extra>): Handler<Organization<OrganizationsStatus, Extra>, void> {
    const useCase = new OrganizationCreateUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository,
      input.actorValidationQuery
    );

    return this.defaultsInterceptors(useCase.execute.bind(useCase), input, 'organization:create');
  }

  private composeUpdate(input: OrganizationCompositionInput<OrganizationsStatus, Extra>): Handler<Organization<OrganizationsStatus, Extra>, void> {
    const useCase = new UpdateOrganizationUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository
    );

    return this.defaultsInterceptors(useCase.update.bind(useCase), input, 'organization:update');
  }

  private composeChangeStatus(input: OrganizationCompositionInput<OrganizationsStatus, Extra>): Handler<Organization<OrganizationsStatus, Extra>, void> {
    const useCase = new ChangeOrganizationStatusUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository
    );

    return this.defaultsInterceptors(useCase.changeStatus.bind(useCase), input, 'organization:change-status');
  }

  private composeFindById(input: OrganizationCompositionInput<OrganizationsStatus, Extra>): Handler<string, Organization<OrganizationsStatus, Extra> | null> {
    const useCase = new FindOrganizationByIdUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository
    );

    return this.defaultsInterceptors(useCase.findById.bind(useCase), input, 'organization:find');
  }

  private composeFindByCnpj(input: OrganizationCompositionInput<OrganizationsStatus, Extra>): Handler<string, Organization<OrganizationsStatus, Extra> | null> {
    const useCase = new FindOrganizationByIdUseCase<OrganizationsStatus, Extra>(
      input.executionContext,
      input.organizationRepository
    );

    return this.defaultsInterceptors(useCase.findByCnpj.bind(useCase), input, 'organization:find');
  }

  private defaultsInterceptors<Input, Output>(
    handler: Handler<Input, Output>,
    input: OrganizationCompositionInput<OrganizationsStatus, Extra>,
    permission: PermissionKey,
  ): Handler<Input, Output> {
    const errorIntercept = new ErrorIntercept<Input, Output>(this.logger);

    if (input.permissionContext) {
      return pipe(
        handler,
        errorIntercept,
        new PermissionIntercept<Input, Output>(permission, input.permissionContext),
      );
    }

    return pipe(
      handler,
      errorIntercept,
    );
  }
}
