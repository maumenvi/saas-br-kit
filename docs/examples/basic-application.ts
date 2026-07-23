import {
  Application,
  type TokenPort,
} from '@maumenvi/saas-br-kit';
import {
  ActorRepositoryMock,
  AppointmentRepositoryMock,
  AuditRepositoryMock,
  CustomerRepositoryMock,
  DatabaseMock,
  LoggerMock,
  MembershipRepositoryMock,
  MfaProviderMock,
  MfaRepositoryMock,
  OrganizationRepositoryMock,
  PasswordHashMock,
  PlanRepositoryMock,
  PolicyActor,
  PolicyAppointment,
  PolicyOrganization,
  PolicyOrganizationSlug,
  PolicySubscriptionPayment,
  ServiceRepositoryMock,
  SubscriptionRepositoryMock,
  type Status,
  VerificationRepositoryMock,
  verificationConfigMock,
} from '@maumenvi/saas-br-kit/mocks';

type Statuses = {
  actors: Status;
  organizations: Status;
  memberships: Status;
  services: Status;
  customers: Status;
  plans: Status;
  subscriptions: Status;
  appointments: Status;
};

type Extras = {
  actors: unknown;
  organizations: unknown;
  memberships: unknown;
  services: unknown;
  customers: unknown;
  plans: unknown;
  subscriptions: unknown;
  appointments: unknown;
};

const tokenPort: TokenPort<string> = {
  payload: { actorId: '', organizationId: '' },
  config: undefined,
  refreshPayload: undefined,
  refreshConfig: undefined,
  createToken: () => 'token-de-exemplo',
  generateToken: async () => 'token-de-exemplo',
  verifyToken: async () => ({}),
  generateRefreshToken: async () => 'refresh-token-de-exemplo',
  verifyRefreshToken: async () => ({}),
};

export const application = new Application<string, Statuses, Extras>({
  executionContextInput: {
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  },
  repositories: {
    actors: new ActorRepositoryMock(),
    audits: new AuditRepositoryMock(),
    organizations: new OrganizationRepositoryMock(),
    memberships: new MembershipRepositoryMock(),
    mfas: new MfaRepositoryMock(),
    verifications: new VerificationRepositoryMock(),
    services: new ServiceRepositoryMock(),
    customers: new CustomerRepositoryMock(),
    plans: new PlanRepositoryMock(),
    subscriptions: new SubscriptionRepositoryMock(),
    appointments: new AppointmentRepositoryMock(),
  },
  authentication: { type: 'LOGIN', tokenPort },
  mfa: { issuer: 'Minha Aplicação', provider: new MfaProviderMock() },
  verification: verificationConfigMock(),
  policy: {
    actor: { actorStatusPolicy: new PolicyActor() },
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
});

console.log('Application criada:', {
  auth: typeof application.auth.authenticate,
  registration: typeof application.registration.createOrganization,
  tenant: typeof application.tenant.resolve,
});
