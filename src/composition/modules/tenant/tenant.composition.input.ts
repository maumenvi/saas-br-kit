import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { OrganizationRepositoryPort } from '../../../core/entities/organization/organization.repositories.ts';
import type { OrganizationSlugPolicyPort } from '../../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../../core/entities/organization/policies/organizations.status.police.ts';

export type TenantCompositionInput<OrganizationStatus> = {
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  organizationRepository: Pick<
    OrganizationRepositoryPort<OrganizationStatus, unknown>,
    'findBySlug'
  >;
  policy: {
    organizationStatusPolicy: OrganizationStatusPolicyPort<OrganizationStatus>;
    organizationSlugPolicy: OrganizationSlugPolicyPort;
  };
};
