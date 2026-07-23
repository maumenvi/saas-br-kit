import {
  ResolveOrganizationTenantUseCase,
  type ResolvedOrganizationTenant,
} from '../../../core/entities/organization/application/organization.resolve.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { TenantCompositionInput } from './tenant.composition.input.ts';

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

    this.resolve = withDefaultInterceptors(useCase.resolve.bind(useCase), {
      action: 'tenant:resolve',
      ...input,
      identityResolver: (_slug, output) => ({
        organizationId: output?.organizationId ?? null,
      }),
    });
  }
}
