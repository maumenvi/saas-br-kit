import type { ExecutionContext } from '../../core/context/execution.context.ts';
import {
  ResolveOrganizationTenantUseCase,
  type ResolvedOrganizationTenant,
} from '../../core/entities/organization/application/organization.resolve.ts';
import type { OrganizationRepositoryPort } from '../../core/entities/organization/organization.repositories.ts';
import type { OrganizationSlugPolicyPort } from '../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../core/entities/organization/policies/organizations.status.police.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type TenantCompositionInput<OrganizationStatus> = {
  executionContext: ExecutionContext;
  organizationRepository: Pick<
    OrganizationRepositoryPort<OrganizationStatus, unknown>,
    'findBySlug'
  >;
  policy: {
    organizationStatusPolicy: OrganizationStatusPolicyPort<OrganizationStatus>;
    organizationSlugPolicy: OrganizationSlugPolicyPort;
  };
};

export class TenantComposition<OrganizationStatus> {
  readonly resolve: Handler<string, ResolvedOrganizationTenant | null>;
  readonly logger: LoggerPort;

  constructor(input: TenantCompositionInput<OrganizationStatus>) {
    this.logger = input.executionContext.loggerProvider;

    const useCase = new ResolveOrganizationTenantUseCase(
      input.executionContext,
      input.organizationRepository,
      input.policy.organizationStatusPolicy,
      input.policy.organizationSlugPolicy,
    );

    this.resolve = pipe(
      useCase.resolve.bind(useCase),
      new ErrorIntercept(this.logger),
    );
  }
}
