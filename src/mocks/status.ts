import type { ActorStatusPolicyPort } from '../core/entities/actor/policies/actor.status.police.ts';
import type { OrganizationStatusPolicyPort } from '../core/entities/organization/policies/organizations.status.police.ts';
import type { OrganizationSlugPolicyPort } from '../core/entities/organization/policies/organization.slug.policy.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../core/entities/subscription/policies/subscription.payment.status.policy.ts';
import type { AppointmentStatusPolicy } from '../core/entities/appointment/policies/appointment.status.policy.ts';
import type { Subscription } from '../core/entities/subscription/subscription.ts';

export type Status = "active" | "inactive" | "pending" | "suspended";

export class PolicyActor implements ActorStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean {
    return status === "active";
  }
}

export class PolicyOrganization implements OrganizationStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean {
    return status === "active";
  }
}

export const RESERVED_ORGANIZATION_SLUGS = [
  'admin',
  'api',
  'auth',
  'www',
] as const;

export class PolicyOrganizationSlug implements OrganizationSlugPolicyPort {
  isReserved(slug: string): boolean {
    return RESERVED_ORGANIZATION_SLUGS.some((reserved) => reserved === slug);
  }
}

export class PolicySubscriptionPayment implements
  SubscriptionPaymentStatusPolicyPort<Status> {
  isPaymentCurrent(subscription: Subscription<Status>, now: Date): boolean {
    return subscription.nextPayment.getTime() >= now.getTime();
  }
}

export class PolicyAppointment implements AppointmentStatusPolicy<Status> {
  readonly cancelledByCustomerStatus = 'inactive' as const;
  readonly cancelledByActorStatus = 'inactive' as const;

  isCancelled(status: Status): boolean {
    return status === 'inactive';
  }
}
