import type {
  Repositories,
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../../core/context/app.context.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { ActorStatusPolicyPort } from '../../../core/entities/actor/policies/actor.status.police.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { MfaConfig } from '../../../core/entities/mfa/mfa.provider.port.ts';
import type { OrganizationSlugPolicyPort } from '../../../core/entities/organization/policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../../../core/entities/organization/policies/organizations.status.police.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../../core/entities/subscription/policies/subscription.payment.status.policy.ts';
import type { AppointmentStatusPolicy } from '../../../core/entities/appointment/policies/appointment.status.policy.ts';

export type PermissionApplicationInput<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
> = {
  executionContext: ExecutionContext;
  membership: Membership<Statuses['memberships'], Extras['memberships']>;
  mfa: MfaConfig;
  verification: VerificationConfig;
  policy: {
    actor: {
      actorStatusPolicy: ActorStatusPolicyPort<Statuses['actors']>;
    };
    organization: {
      organizationStatusPolicy: OrganizationStatusPolicyPort<
        Statuses['organizations']
      >;
      organizationSlugPolicy: OrganizationSlugPolicyPort;
    };
    subscription: {
      subscriptionPaymentStatusPolicy: SubscriptionPaymentStatusPolicyPort<
        Statuses['subscriptions'],
        Extras['subscriptions']
      >;
    };
    appointment: {
      appointmentStatusPolicy: AppointmentStatusPolicy<
        Statuses['appointments']
      >;
    };
  };
  repositories: Repositories<Statuses, Extras>;
};
