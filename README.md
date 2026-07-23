# @maumenvi/saas-br-kit

Core TypeScript reutilizável para aplicações SaaS brasileiras. A biblioteca
entrega regras de domínio, casos de uso, contratos de infraestrutura e uma
facade de composição sem depender de framework HTTP, ORM, banco de dados ou
provedor externo.

Ela pode ser usada para:

- cadastrar organizações e seu primeiro usuário;
- autenticar por login, credentials, OAuth, API key ou estratégia customizada;
- resolver tenants por slug;
- proteger operações com permissions por membership;
- gerenciar actors, organizações, memberships, serviços, clientes, planos,
  assinaturas e appointments;
- configurar MFA TOTP;
- confirmar email, telefone, convites e respostas de appointments;
- auditar operações e adicionar idempotência;
- integrar email, mensagens telefônicas e calendário por ports.

## Comece por aqui

1. Leia os [requisitos e o estado do pacote](./docs/requirements.md).
2. Siga o [primeiro uso](./docs/getting-started.md).
3. Entenda a [arquitetura](./docs/architecture.md).
4. Consulte o [catálogo de casos de uso](./docs/use-cases.md).
5. Implemente os [ports](./docs/ports.md).

O [índice completo da documentação](./docs/README.md) organiza os guias por
tarefa.

## Instalação

### Checkout local

Na aplicação consumidora:

```bash
npm install ../saas-br-kit
```

O lifecycle `prepare` gera `dist/` e o pacote passa a ser importado pelo nome:

```ts
import {
  Application,
  type DatabasePort,
} from '@maumenvi/saas-br-kit';
```

### GitHub Packages privado

Configure o scope na aplicação consumidora:

```ini
@maumenvi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

Exporte um token com `read:packages` e instale uma versão publicada:

```bash
export GITHUB_TOKEN=github_pat_replace_me
npm install @maumenvi/saas-br-kit@1.0.0
```

Veja [Publicação e instalação](./docs/publishing.md) para o release manual,
permissões e visibilidade.

## Pontos de entrada

```ts
import { Application } from '@maumenvi/saas-br-kit';
import { DatabaseMock } from '@maumenvi/saas-br-kit/mocks';
```

- `@maumenvi/saas-br-kit`: API pública de Core e composition;
- `@maumenvi/saas-br-kit/mocks`: mocks para testes e exemplos;
- `@maumenvi/saas-br-kit/package.json`: metadados do pacote.

Imports internos como `src/...` e `dist/...` não fazem parte do contrato público.

## Exemplo mínimo

Depois de instalar o pacote, crie `example.ts` na aplicação consumidora:

```ts
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

console.log(typeof application.registration.createOrganization);
```

Execute:

```bash
node example.ts
```

Os mocks servem apenas para estudo e testes. Em produção, implemente os ports
com seu banco, logger, hash, token e provedores.

## Modelo mental

```text
HTTP, worker ou CLI do consumidor
             |
             v
        Application
        /          \
facades públicas   withPermission(membership)
        \          /
        compositions e interceptors
                 |
              use cases
                 |
               ports
                 |
       adapters do consumidor
```

O Core decide regras de negócio. O consumidor decide HTTP, persistência,
framework, templates, tokens, filas e provedores externos.

## Validação do repositório

```bash
npm run test:layout
npm run test:imports
npm test
npm run typecheck
npm run build
npm run test:package
git diff --check
```

## Estado atual

A biblioteca é empacotada como ESM, publica JavaScript e declarations em
`dist/`, aceita instalação local e está configurada para publicação privada no
GitHub Packages. O release é iniciado manualmente pelo workflow
`Release package`.
