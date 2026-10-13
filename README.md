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

O pacote é publicado no npm como `@maumenvi/saas-br-kit`. Não é preciso token
nem configuração de registry:

```bash
npm install @maumenvi/saas-br-kit
```

Requer Node.js 24 ou superior. O pacote é ESM-only.

## Importação

O ponto de entrada público da lib é:

```ts
import {
  Application,
  type DatabasePort,
  type TokenPort,
} from '@maumenvi/saas-br-kit';
```

Mocks para testes são disponibilizados pelo subpath oficial:

```ts
import { DatabaseMock } from '@maumenvi/saas-br-kit/mocks';
```

Não importe arquivos de `src/` ou `dist/`; caminhos internos não fazem parte da
API pública:

```ts
// Incorreto
import { Application } from '@maumenvi/saas-br-kit/dist/index.js';
```

Veja [Publicação e instalação](./docs/publishing.md) para instalação local a
partir do checkout e para o processo de release.

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

## Desenvolvimento

```bash
git clone https://github.com/maumenvi/saas-br-kit.git
cd saas-br-kit
npm install
```

Validação completa, a mesma executada pela CI:

```bash
npm run test:layout
npm run test:imports
npm test
npm run typecheck
npm run build
npm run test:package
git diff --check
```

O desenvolvimento e os testes executam TypeScript diretamente pelo Node.js. O
`dist/` é gerado somente para empacotamento.

## Contribuindo

Issues e pull requests são bem-vindos. Leia o [guia de contribuição](./CONTRIBUTING.md)
antes de abrir um PR.

## Licença

[MIT](./LICENSE)
