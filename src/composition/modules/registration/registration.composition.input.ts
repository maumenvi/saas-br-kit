import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../../core/entities/actor/actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { MembershipRepositoryPort } from '../../../core/entities/membership/membership.repositories.ts';
import type { OrganizationRepositoryPort } from '../../../core/entities/organization/organization.repositories.ts';
import type { OrganizationSlugPolicyPort } from '../../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../../core/entities/organization/policies/organizations.status.police.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';

export type RegistrationCompositionInput<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  actorRepository: ActorRepositoryPort<ActorStatus, ActorExtra>;
  organizationRepository: OrganizationRepositoryPort<
    OrganizationStatus,
    OrganizationExtra
  >;
  membershipRepository: MembershipRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;
  verificationRepository: VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
  verification: VerificationConfig;
  policy: {
    actorStatusPolicy: ActorStatusPolicyPort<ActorStatus>;
    organizationStatusPolicy: OrganizationStatusPolicyPort<OrganizationStatus>;
    organizationSlugPolicy: OrganizationSlugPolicyPort;
  };
};
