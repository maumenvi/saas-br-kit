import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';

export type ActorCompositionInput<
  ActorsStatus,
  ActorExtra = unknown,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorsStatus, ActorExtra>;
  verificationRepository: VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
  verification: VerificationConfig;
  auditRepository: AuditRepositoryPort;
  policy: {
    actorStatusPolicy: ActorStatusPolicyPort<ActorsStatus>;
  };
  permissionContext?: PermissionContext;
};
