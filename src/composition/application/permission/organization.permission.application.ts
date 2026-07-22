import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { OrganizationRepositoryPort } from '../../../core/entities/organization/organization.repositories.ts';
import type { OrganizationValidationQueryPort } from '../../../core/entities/organization/organization.validation.query.port.ts';
import type { OrganizationSlugPolicyPort } from '../../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../../core/entities/organization/policies/organizations.status.police.ts';
import { OrganizationComposition } from '../../modules/organization/organization.composition.ts';

export type OrganizationPermissionApplication<Status, Extra = unknown> = Pick<
  OrganizationComposition<Status, Extra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByCnpj'
>;

type OrganizationPermissionScopeInput<Status, Extra> = {
  executionContext: ExecutionContext;
  organizationRepository: OrganizationRepositoryPort<Status, Extra>;
  auditRepository: AuditRepositoryPort;
  actorValidationQuery: ActorValidationQueryPort;
  organizationStatusPolicy: OrganizationStatusPolicyPort<Status>;
  organizationSlugPolicy: OrganizationSlugPolicyPort;
  permissionContext: PermissionContext;
};

type OrganizationPermissionScope<Status, Extra> = Readonly<{
  application: OrganizationPermissionApplication<Status, Extra>;
  validationQuery: OrganizationValidationQueryPort;
}>;

export function createOrganizationPermissionScope<Status, Extra = unknown>(
  input: OrganizationPermissionScopeInput<Status, Extra>,
): OrganizationPermissionScope<Status, Extra> {
  const composition = new OrganizationComposition({
    executionContext: input.executionContext,
    organizationRepository: input.organizationRepository,
    auditRepository: input.auditRepository,
    actorValidationQuery: input.actorValidationQuery,
    policy: {
      organizationStatusPolicy: input.organizationStatusPolicy,
      organizationSlugPolicy: input.organizationSlugPolicy,
    },
    permissionContext: input.permissionContext,
  });

  return Object.freeze({
    application: Object.freeze({
      create: composition.create,
      update: composition.update,
      changeStatus: composition.changeStatus,
      findById: composition.findById,
      findByCnpj: composition.findByCnpj,
    }),
    validationQuery: composition.validationQuery,
  });
}
