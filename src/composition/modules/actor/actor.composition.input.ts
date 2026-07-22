import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';

export type ActorCompositionInput<ActorsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorsStatus, Extra>;
  auditRepository: AuditRepositoryPort;
  policy: {
    actorStatusPolicy: ActorStatusPolicyPort<ActorsStatus>;
  };
  permissionContext?: PermissionContext;
};
