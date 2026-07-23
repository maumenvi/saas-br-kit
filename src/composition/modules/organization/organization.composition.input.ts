import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { OrganizationRepositoryPort } from '../../../core/entities/organization/organization.repositories.ts';
import type { OrganizationSlugPolicyPort } from '../../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../../core/entities/organization/policies/organizations.status.police.ts';

export type OrganizationCompositionInput<
  OrganizationsStatus,
  Extra = unknown,
> = {
  executionContext: ExecutionContext;
  organizationRepository: OrganizationRepositoryPort<OrganizationsStatus, Extra>;
  auditRepository: AuditRepositoryPort;
  actorValidationQuery: ActorValidationQueryPort;
  policy: {
    organizationStatusPolicy: OrganizationStatusPolicyPort<OrganizationsStatus>;
    organizationSlugPolicy: OrganizationSlugPolicyPort;
  };
  permissionContext?: PermissionContext;
};
