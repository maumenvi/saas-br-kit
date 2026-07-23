# Primeiro uso

Este guia monta a facade principal e mostra o fluxo que uma API normalmente
executa. Use os mocks somente para aprender; depois substitua cada um por um
adapter real.

Há também um
[exemplo completo e executável](./examples/basic-application.ts):

```bash
npm run build
node docs/examples/basic-application.ts
```

## 1. Defina os status

Cada agregado pode ter seu próprio tipo:

```ts
type Statuses = {
  actors: 'active' | 'blocked';
  organizations: 'active' | 'blocked';
  memberships: 'active' | 'revoked';
  services: 'active' | 'archived';
  customers: 'active' | 'anonymized';
  plans: 'active' | 'inactive';
  subscriptions: 'active' | 'overdue';
  appointments: 'scheduled' | 'cancelled';
};
```

Se suas entidades persistidas têm campos adicionais, declare `Extras`:

```ts
type Extras = {
  actors: { avatarUrl?: string };
  organizations: { timezone: string };
  memberships: unknown;
  services: unknown;
  customers: unknown;
  plans: unknown;
  subscriptions: { invoiceId?: string };
  appointments: { notes?: string };
};
```

Use `unknown` quando não houver campo extra.

## 2. Implemente as policies

Policies traduzem decisões do seu produto para o Core:

```ts
import type {
  ActorStatusPolicyPort,
  AppointmentStatusPolicy,
  OrganizationSlugPolicyPort,
  OrganizationStatusPolicyPort,
  Subscription,
  SubscriptionPaymentStatusPolicyPort,
} from '@maumenvi/saas-br-kit';

class ActorStatusPolicy
  implements ActorStatusPolicyPort<Statuses['actors']> {
  isEnabled(status: Statuses['actors']): boolean {
    return status === 'active';
  }
}

class OrganizationStatusPolicy
  implements OrganizationStatusPolicyPort<Statuses['organizations']> {
  isEnabled(status: Statuses['organizations']): boolean {
    return status === 'active';
  }
}

class SlugPolicy implements OrganizationSlugPolicyPort {
  isReserved(slug: string): boolean {
    return ['admin', 'api', 'auth', 'www'].includes(slug);
  }
}

class PaymentPolicy
  implements SubscriptionPaymentStatusPolicyPort<
    Statuses['subscriptions'],
    Extras['subscriptions']
  > {
  isPaymentCurrent(
    subscription: Subscription<
      Statuses['subscriptions'],
      Extras['subscriptions']
    >,
    now: Date,
  ): boolean {
    return subscription.nextPayment.getTime() >= now.getTime();
  }
}

class AppointmentPolicy
  implements AppointmentStatusPolicy<Statuses['appointments']> {
  readonly cancelledByCustomerStatus = 'cancelled' as const;
  readonly cancelledByActorStatus = 'cancelled' as const;

  isCancelled(status: Statuses['appointments']): boolean {
    return status === 'cancelled';
  }
}
```

## 3. Implemente os adapters

Todos os adapters são objetos que cumprem interfaces. Por exemplo:

```ts
import type {
  DatabasePort,
  LoggerPort,
  PasswordHashPort,
} from '@maumenvi/saas-br-kit';

const databaseProvider: DatabasePort = {
  async run<T>(callback: (transaction: unknown) => Promise<T>): Promise<T> {
    // Em produção, abra a transação do ORM e disponibilize seu contexto
    // transacional para os repositories.
    return await callback(undefined);
  },
};

const loggerProvider: LoggerPort = {
  error: (message, ...args) => console.error(message, ...args),
  warn: (message, ...args) => console.warn(message, ...args),
  info: (message, ...args) => console.info(message, ...args),
  debug: (message, ...args) => console.debug(message, ...args),
};

const passwordHashProvider: PasswordHashPort = {
  hash: async (password) => hashComArgon2OuBcrypt(password),
  verify: async (password, hash) => verifyComArgon2OuBcrypt(password, hash),
};
```

As funções `hashComArgon2OuBcrypt` e `verifyComArgon2OuBcrypt` são do adapter do
seu projeto; a lib não escolhe a implementação.

Implemente também todos os repositories exigidos por `Application`. O catálogo
completo está em [Ports](./ports.md).

## 4. Implemente o token

`TokenPort<Output>` permite que o retorno seja string ou um objeto:

```ts
type TokenOutput = {
  accessToken: string;
  refreshToken: string;
};

const tokenPort: TokenPort<TokenOutput> = {
  payload: { actorId: '', organizationId: '' },
  config: {},
  refreshPayload: {},
  refreshConfig: {},

  createToken(payload, config) {
    return {
      accessToken: signAccessToken(payload, config),
      refreshToken: signRefreshToken(payload),
    };
  },

  async generateToken(payload, config) {
    return signAccessToken(payload, config);
  },

  async verifyToken(token) {
    return verifyAccessToken(token);
  },

  async generateRefreshToken(payload, config) {
    return signRefreshToken(payload, config);
  },

  async verifyRefreshToken(token) {
    return verifyRefreshToken(token);
  },
};
```

No fluxo atual de autenticação, o Core chama `createToken`. Os outros métodos
continuam no contrato para o adapter de token, mas validação e renovação de
sessão não são uma facade pronta da `Application`.

## 5. Monte Application

```ts
import { Application } from '@maumenvi/saas-br-kit';

const application = new Application<
  TokenOutput,
  Statuses,
  Extras
>({
  executionContextInput: {
    databaseProvider,
    loggerProvider,
    passwordHashProvider,
    sendEmailPort,
    sendTelefoneMessagePort,
    calendarIntegrationPort,
    idempotencyProvider,
  },
  repositories: {
    actors: actorRepository,
    audits: auditRepository,
    organizations: organizationRepository,
    memberships: membershipRepository,
    mfas: mfaRepository,
    verifications: verificationRepository,
    services: serviceRepository,
    customers: customerRepository,
    plans: planRepository,
    subscriptions: subscriptionRepository,
    appointments: appointmentRepository,
  },
  authentication: {
    type: 'LOGIN',
    tokenPort,
  },
  mfa: {
    issuer: 'Minha Aplicação',
    provider: mfaProvider,
  },
  verification: {
    credentialProvider: verificationCredentialProvider,
    ttlMs: {
      EMAIL_CONFIRMATION: 15 * 60 * 1000,
      TELEPHONE_CONFIRMATION: 5 * 60 * 1000,
      ORGANIZATION_INVITATION: 7 * 24 * 60 * 60 * 1000,
    },
    maxAttempts: 5,
  },
  policy: {
    actor: {
      actorStatusPolicy: new ActorStatusPolicy(),
    },
    organization: {
      organizationStatusPolicy: new OrganizationStatusPolicy(),
      organizationSlugPolicy: new SlugPolicy(),
    },
    subscription: {
      subscriptionPaymentStatusPolicy: new PaymentPolicy(),
    },
    appointment: {
      appointmentStatusPolicy: new AppointmentPolicy(),
    },
  },
});
```

Os ports opcionais podem ser omitidos. Os repositories, MFA, verification e
policies do input são obrigatórios na facade completa, mesmo que uma API ainda
não exponha todos os módulos.

## 6. Fluxo público

### Resolver tenant

```ts
const tenant = await application.tenant.resolve('acme');

if (!tenant) {
  throw new Error('Organização não encontrada ou desabilitada');
}
```

### Autenticar

```ts
const session = await application.auth.authenticate({
  authenticated: {
    email: 'ana@acme.com',
    password: 'senha-recebida-no-request',
    organizationId: tenant.organizationId,
  },
  payload: {
    actorId: '',
    organizationId: tenant.organizationId,
  },
  config: { expiresIn: '15m' },
});
```

O `actorId` final vem do adapter de autenticação e o `organizationId` final vem
do membership encontrado. Não confie nesses campos quando enviados pelo cliente.

## 7. Fluxo protegido

```ts
const protectedApplication =
  application.withPermission(session.membership);

const services = await protectedApplication.service.findByOrganizationId(
  session.membership.organizationId,
);
```

Se o membership não possui `service:find`, a chamada lança `DomainError` antes
do use case e antes da transação.

## 8. Mapeie para HTTP

A biblioteca não conhece request ou response. Um controller deve:

1. validar e converter DTOs;
2. extrair o tenant de uma origem confiável;
3. chamar a facade;
4. transformar `DomainError` em resposta HTTP;
5. não expor `passwordHash`, credentials ou objetos internos;
6. aplicar rate limiting nas rotas públicas;
7. definir códigos HTTP conforme o contrato da sua API.

Exemplo conceitual:

```ts
async function listServicesController(request: Request): Promise<Response> {
  const session = await requireSession(request);
  const app = application.withPermission(session.membership);
  const services = await app.service.findByOrganizationId(
    session.membership.organizationId,
  );

  return Response.json(services);
}
```
