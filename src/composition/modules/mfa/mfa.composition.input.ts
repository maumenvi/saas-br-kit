import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { MfaProviderPort } from '../../../core/entities/mfa/mfa.provider.port.ts';
import type { MfaRepositoryPort } from '../../../core/entities/mfa/mfa.repositories.ts';

export type MfaCompositionInput<ActorStatus, ActorExtra = unknown> = {
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  actorRepository: Pick<
    ActorRepositoryPort<ActorStatus, ActorExtra>,
    'findById'
  >;
  actorStatusPolicy: ActorStatusPolicyPort<ActorStatus>;
  mfaRepository: MfaRepositoryPort;
  mfaProvider: MfaProviderPort;
  issuer: string;
  permissionContext: PermissionContext;
};
