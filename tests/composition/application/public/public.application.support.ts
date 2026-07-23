import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import type { TokenPort } from '../../../../src/core/ports/token.port.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import { MfaProviderMock } from '../../../../src/mocks/mfa.provider.ts';
import { MfaRepositoryMock } from '../../../../src/mocks/mfa.repository.ts';
import { OrganizationRepositoryMock } from '../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../src/mocks/verification.repository.ts';
import { ServiceRepositoryMock } from '../../../../src/mocks/service.repository.ts';
import { CustomerRepositoryMock } from '../../../../src/mocks/customer.repository.ts';
import { PlanRepositoryMock } from '../../../../src/mocks/plan.repository.ts';
import { SubscriptionRepositoryMock } from '../../../../src/mocks/subscription.repository.ts';
import { AppointmentRepositoryMock } from '../../../../src/mocks/appointment.repository.ts';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  PolicySubscriptionPayment,
  PolicyAppointment,
  type Status,
} from '../../../../src/mocks/status.ts';

export type Statuses = {
  actors: Status;
  organizations: Status;
  memberships: Status;
  services: Status;
  customers: Status;
  plans: Status;
  subscriptions: Status;
  appointments: Status;
};

export type Extras = {
  actors: unknown;
  organizations: unknown;
  memberships: unknown;
  services: unknown;
  customers: unknown;
  plans: unknown;
  subscriptions: unknown;
  appointments: unknown;
};

function tokenPort(): TokenPort<string> {
  return {
    payload: { actorId: 'actor-1', organizationId: 'organization-1' },
    config: undefined,
    refreshPayload: undefined,
    refreshConfig: undefined,
    createToken: () => 'generated-token',
    generateToken: async () => 'generated-token',
    verifyToken: async () => ({}),
    generateRefreshToken: async () => 'generated-refresh-token',
    verifyRefreshToken: async () => ({}),
  };
}

export function publicApplicationInput() {
  return {
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    authentication: {
      type: 'LOGIN' as const,
      tokenPort: tokenPort(),
    },
    mfa: {
      issuer: 'SaaS BR',
      provider: new MfaProviderMock(),
    },
    verification: verificationConfigMock(),
    repositories: {
      actors: new ActorRepositoryMock(),
      audits: new AuditRepositoryMock(),
      memberships: new MembershipRepositoryMock(),
      mfas: new MfaRepositoryMock(),
      organizations: new OrganizationRepositoryMock(),
      verifications: new VerificationRepositoryMock(),
      services: new ServiceRepositoryMock(),
      customers: new CustomerRepositoryMock(),
      plans: new PlanRepositoryMock(),
      subscriptions: new SubscriptionRepositoryMock(),
      appointments: new AppointmentRepositoryMock(),
    },
    policy: {
      actor: {
        actorStatusPolicy: new PolicyActor(),
      },
      organization: {
        organizationStatusPolicy: new PolicyOrganization(),
        organizationSlugPolicy: new PolicyOrganizationSlug(),
      },
      subscription: {
        subscriptionPaymentStatusPolicy: new PolicySubscriptionPayment(),
      },
      appointment: {
        appointmentStatusPolicy: new PolicyAppointment(),
      },
    },
  };
}
