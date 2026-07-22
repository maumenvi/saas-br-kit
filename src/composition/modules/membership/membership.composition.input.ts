import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { MembershipRepositoryPort } from '../../../core/entities/membership/membership.repositories.ts';
import type { OrganizationValidationQueryPort } from '../../../core/entities/organization/organization.validation.query.port.ts';

export type MembershipCompositionInput<MembershipsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  membershipRepository: MembershipRepositoryPort<MembershipsStatus, Extra>;
  auditRepository: AuditRepositoryPort;
  actorValidationQuery: ActorValidationQueryPort;
  organizationValidationQuery: OrganizationValidationQueryPort;
  permissionContext?: PermissionContext;
};
