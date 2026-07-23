import type {
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../../core/context/app.context.ts';
import {
  createActorPermissionScope,
  type ActorPermissionApplication,
} from './actor.permission.application.ts';
import {
  createMembershipPermissionScope,
  type MembershipPermissionApplication,
} from './membership.permission.application.ts';
import {
  createMfaPermissionScope,
  type MfaPermissionApplication,
} from './mfa.permission.application.ts';
import {
  createOrganizationPermissionScope,
  type OrganizationPermissionApplication,
} from './organization.permission.application.ts';
import type { PermissionApplicationInput } from './permission.application.input.ts';
import {
  createServicePermissionApplication,
  type ServicePermissionApplication,
} from './service.permission.application.ts';
import {
  createCustomerPermissionApplication,
  type CustomerPermissionApplication,
} from './customer.permission.application.ts';
import {
  createPlanPermissionApplication,
  type PlanPermissionApplication,
} from './plan.permission.application.ts';
import {
  createSubscriptionPermissionApplication,
  type SubscriptionPermissionApplication,
} from './subscription.permission.application.ts';
import {
  createAppointmentPermissionApplication,
  type AppointmentPermissionApplication,
} from './appointment.permission.application.ts';

export type PermissionApplication<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
> = Readonly<{
  actor: ActorPermissionApplication<
    Statuses['actors'],
    Extras['actors'],
    Statuses['memberships'],
    Extras['memberships']
  >;
  organization: OrganizationPermissionApplication<
    Statuses['organizations'],
    Extras['organizations']
  >;
  membership: MembershipPermissionApplication<
    Statuses['memberships'],
    Extras['memberships']
  >;
  mfa: MfaPermissionApplication<Statuses['actors'], Extras['actors']>;
  service: ServicePermissionApplication<
    Statuses['services'],
    Extras['services']
  >;
  customer: CustomerPermissionApplication<
    Statuses['customers'],
    Extras['customers']
  >;
  plan: PlanPermissionApplication<Statuses['plans'], Extras['plans']>;
  subscription: SubscriptionPermissionApplication<
    Statuses['subscriptions'],
    Extras['subscriptions']
  >;
  appointment: AppointmentPermissionApplication<
    Statuses['appointments'],
    Statuses['memberships'],
    Extras['appointments'],
    Extras['memberships']
  >;
}>;

export function createPermissionApplication<
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
>(
  input: PermissionApplicationInput<Statuses, Extras>,
): PermissionApplication<Statuses, Extras> {
  const actor = createActorPermissionScope({
    executionContext: input.executionContext,
    actorRepository: input.repositories.actors,
    auditRepository: input.repositories.audits,
    actorStatusPolicy: input.policy.actor.actorStatusPolicy,
    permissionContext: input.membership,
    verificationRepository: input.repositories.verifications,
    verification: input.verification,
  });

  const organization = createOrganizationPermissionScope({
    executionContext: input.executionContext,
    organizationRepository: input.repositories.organizations,
    auditRepository: input.repositories.audits,
    actorValidationQuery: actor.validationQuery,
    organizationStatusPolicy:
      input.policy.organization.organizationStatusPolicy,
    organizationSlugPolicy: input.policy.organization.organizationSlugPolicy,
    permissionContext: input.membership,
  });

  const membership = createMembershipPermissionScope({
    executionContext: input.executionContext,
    membershipRepository: input.repositories.memberships,
    auditRepository: input.repositories.audits,
    actorValidationQuery: actor.validationQuery,
    organizationValidationQuery: organization.validationQuery,
    permissionContext: input.membership,
    verificationRepository: input.repositories.verifications,
    verification: input.verification,
  });

  const mfa = createMfaPermissionScope({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    actorRepository: input.repositories.actors,
    actorStatusPolicy: input.policy.actor.actorStatusPolicy,
    mfaRepository: input.repositories.mfas,
    mfaProvider: input.mfa.provider,
    issuer: input.mfa.issuer,
    permissionContext: input.membership,
  });

  const service = createServicePermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    serviceRepository: input.repositories.services,
    permissionContext: input.membership,
  });

  const customer = createCustomerPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    customerRepository: input.repositories.customers,
    permissionContext: input.membership,
  });

  const plan = createPlanPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    planRepository: input.repositories.plans,
    serviceRepository: input.repositories.services,
    permissionContext: input.membership,
  });

  const subscription = createSubscriptionPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    subscriptionRepository: input.repositories.subscriptions,
    customerRepository: input.repositories.customers,
    planRepository: input.repositories.plans,
    permissionContext: input.membership,
  });

  const appointment = createAppointmentPermissionApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    appointmentRepository: input.repositories.appointments,
    customerRepository: input.repositories.customers,
    serviceRepository: input.repositories.services,
    subscriptionRepository: input.repositories.subscriptions,
    verificationRepository: input.repositories.verifications,
    subscriptionPaymentStatusPolicy:
      input.policy.subscription.subscriptionPaymentStatusPolicy,
    appointmentStatusPolicy:
      input.policy.appointment.appointmentStatusPolicy,
    verification: input.verification,
    permissionContext: input.membership,
  });

  return Object.freeze({
    actor: actor.application,
    organization: organization.application,
    membership: membership.application,
    mfa,
    service,
    customer,
    plan,
    subscription,
    appointment,
  });
}
