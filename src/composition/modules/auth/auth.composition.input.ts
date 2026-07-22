import type { Authentication } from '../../../core/context/app.context.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { AuthType } from '../../../core/entities/auth/application/auth.authorize.ts';
import type { MembershipRepositoryPort } from '../../../core/entities/membership/membership.repositories.ts';

export type AuthCompositionInput<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  actorRepositoryPort: Pick<ActorRepositoryPort<unknown, unknown>, 'findByEmail'>;
  membershipRepository: Pick<
    MembershipRepositoryPort<MembershipStatus, MembershipExtra>,
    'findByActorOrganizationId'
  >;
  authentication: Authentication<Output, Type, CustomAuth>;
};
