import type { Organization } from '../../../core/entities/organization/organization.ts';
import type { OrganizationValidationQueryPort } from '../../../core/entities/organization/organization.validation.query.port.ts';
import { OrganizationDataValidationService } from '../../../core/entities/organization/services/organization.data.validation.service.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { composeOrganizationChangeStatus } from './organization.change.status.composition.ts';
import type { OrganizationCompositionInput } from './organization.composition.input.ts';
import { composeOrganizationCreate } from './organization.create.composition.ts';
import {
  composeOrganizationFindByCnpj,
  composeOrganizationFindById,
  composeOrganizationFindBySlug,
} from './organization.find.composition.ts';
import { composeOrganizationUpdate } from './organization.update.composition.ts';

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
    this.create = composeOrganizationCreate(input);
    this.update = composeOrganizationUpdate(input);
    this.changeStatus = composeOrganizationChangeStatus(input);
    this.findById = composeOrganizationFindById(input);
    this.findByCnpj = composeOrganizationFindByCnpj(input);
    this.findBySlug = composeOrganizationFindBySlug(input);

    this.validationQuery = new OrganizationDataValidationService(
      input.organizationRepository,
      input.policy.organizationStatusPolicy,
    );
  }
}
