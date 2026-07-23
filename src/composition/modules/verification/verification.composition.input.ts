import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { MembershipRepositoryPort } from '../../../core/entities/membership/membership.repositories.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';

export type VerificationCompositionInput<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorStatus, ActorExtra>;
  membershipRepository: MembershipRepositoryPort<MembershipStatus, MembershipExtra>;
  verificationRepository: VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
  verification: VerificationConfig;
  auditRepository: AuditRepositoryPort;
};
