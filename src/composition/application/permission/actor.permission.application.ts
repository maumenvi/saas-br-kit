import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import { ActorComposition } from '../../modules/actor/actor.composition.ts';

export type ActorPermissionApplication<Status, Extra = unknown> = Pick<
  ActorComposition<Status, Extra>,
  | 'create'
  | 'update'
  | 'changeStatus'
  | 'findById'
  | 'findByEmail'
  | 'findByTelephone'
  | 'findByName'
>;

type ActorPermissionScopeInput<Status, Extra> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<Status, Extra>;
  auditRepository: AuditRepositoryPort;
  actorStatusPolicy: ActorStatusPolicyPort<Status>;
  permissionContext: PermissionContext;
};

type ActorPermissionScope<Status, Extra> = Readonly<{
  application: ActorPermissionApplication<Status, Extra>;
  validationQuery: ActorValidationQueryPort;
}>;

export function createActorPermissionScope<Status, Extra = unknown>(
  input: ActorPermissionScopeInput<Status, Extra>,
): ActorPermissionScope<Status, Extra> {
  const composition = new ActorComposition({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    auditRepository: input.auditRepository,
    policy: {
      actorStatusPolicy: input.actorStatusPolicy,
    },
    permissionContext: input.permissionContext,
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
    }),
    validationQuery: composition.validationQuery,
  });
}
