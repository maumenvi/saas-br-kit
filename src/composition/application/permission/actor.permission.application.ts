import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';
import { ActorComposition } from '../../modules/actor/actor.composition.ts';

export type ActorPermissionApplication<
  Status,
  Extra = unknown,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> = Pick<
  ActorComposition<Status, Extra, MembershipStatus, MembershipExtra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByEmail'
  | 'findByTelephone'
  | 'findByName'
  | 'sendOrganizationWelcomeEmail'
  | 'sendOrganizationInvitationEmail'
  | 'requestEmailConfirmation'
  | 'requestTelephoneConfirmation'
  | 'sendEmailConfirmation'
  | 'sendTelephoneConfirmation'
>;

type ActorPermissionScopeInput<Status, Extra, MembershipStatus, MembershipExtra> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<Status, Extra>;
  auditRepository: AuditRepositoryPort;
  actorStatusPolicy: ActorStatusPolicyPort<Status>;
  permissionContext: PermissionContext;
  verificationRepository: VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
  verification: VerificationConfig;
};

type ActorPermissionScope<Status, Extra, MembershipStatus, MembershipExtra> = Readonly<{
  application: ActorPermissionApplication<Status, Extra, MembershipStatus, MembershipExtra>;
  validationQuery: ActorValidationQueryPort;
}>;

export function createActorPermissionScope<
  Status,
  Extra = unknown,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
>(
  input: ActorPermissionScopeInput<Status, Extra, MembershipStatus, MembershipExtra>,
): ActorPermissionScope<Status, Extra, MembershipStatus, MembershipExtra> {
  const composition = new ActorComposition({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    auditRepository: input.auditRepository,
    policy: {
      actorStatusPolicy: input.actorStatusPolicy,
    },
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
      findByEmail: composition.findByEmail,
      findByTelephone: composition.findByTelephone,
      findByName: composition.findByName,
      sendOrganizationWelcomeEmail: composition.sendOrganizationWelcomeEmail,
      sendOrganizationInvitationEmail:
        composition.sendOrganizationInvitationEmail,
      requestEmailConfirmation: composition.requestEmailConfirmation,
      requestTelephoneConfirmation: composition.requestTelephoneConfirmation,
      sendEmailConfirmation: composition.sendEmailConfirmation,
      sendTelephoneConfirmation: composition.sendTelephoneConfirmation,
    }),
    validationQuery: composition.validationQuery,
  });
}
