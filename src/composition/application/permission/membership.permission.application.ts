import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { MembershipRepositoryPort } from '../../../core/entities/membership/membership.repositories.ts';
import type { OrganizationValidationQueryPort } from '../../../core/entities/organization/organization.validation.query.port.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';
import { MembershipComposition } from '../../modules/membership/membership.composition.ts';

export type MembershipPermissionApplication<Status, Extra = unknown> = Pick<
  MembershipComposition<Status, Extra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByOrganizationId'
  | 'findByActorId'
  | 'requestOrganizationInvitation'
>;

type MembershipPermissionScopeInput<Status, Extra> = {
  executionContext: ExecutionContext;
  membershipRepository: MembershipRepositoryPort<Status, Extra>;
  auditRepository: AuditRepositoryPort;
  actorValidationQuery: ActorValidationQueryPort;
  organizationValidationQuery: OrganizationValidationQueryPort;
  permissionContext: PermissionContext;
  verificationRepository: VerificationRepositoryPort<Status, Extra>;
  verification: VerificationConfig;
};

type MembershipPermissionScope<Status, Extra> = Readonly<{
  application: MembershipPermissionApplication<Status, Extra>;
}>;

export function createMembershipPermissionScope<Status, Extra = unknown>(
  input: MembershipPermissionScopeInput<Status, Extra>,
): MembershipPermissionScope<Status, Extra> {
  const composition = new MembershipComposition({
    executionContext: input.executionContext,
    membershipRepository: input.membershipRepository,
    auditRepository: input.auditRepository,
    actorValidationQuery: input.actorValidationQuery,
    organizationValidationQuery: input.organizationValidationQuery,
    permissionContext: input.permissionContext,
    verificationRepository: input.verificationRepository,
    verification: input.verification,
  });

  return Object.freeze({
    application: Object.freeze({
      create: composition.create,
      update: composition.update,
      changeStatus: composition.changeStatus,
      findById: composition.findById,
      findByOrganizationId: composition.findByOrganizationId,
      findByActorId: composition.findByActorId,
      requestOrganizationInvitation: composition.requestOrganizationInvitation,
    }),
  });
}
