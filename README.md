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

## Como importar a lib privada

O único ponto de entrada documentado para aplicações consumidoras é o pacote
privado `@maumenvi/saas-br-kit`, publicado no GitHub Packages. Não importe
arquivos do repositório, de `src/` ou de `dist/`.

### 1. Solicite acesso

Sua conta do GitHub precisa ter permissão de leitura no package. Quando a
organização usar SSO, autorize o token para a organização. O repositório
consumidor também precisa estar na lista de repositórios autorizados em
`Package settings > Manage Actions access`.

### 2. Crie um token de leitura

No GitHub:

1. abra `Settings > Developer settings`;
2. acesse `Personal access tokens > Tokens (classic)`;
3. crie um token com o escopo `read:packages`;
4. copie o token, pois o GitHub não voltará a exibi-lo.

Use um personal access token classic. Nunca coloque o token diretamente no
`package.json`, no `.npmrc` ou no código-fonte.

### 3. Configure o registry

Na raiz da aplicação consumidora, ao lado do `package.json`, crie um `.npmrc`:

```ini
@maumenvi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

Esse arquivo pode ser versionado porque contém apenas a referência à variável,
não o token real.

### 4. Disponibilize o token

Linux ou macOS:

```bash
export GITHUB_TOKEN=github_pat_replace_me
```

PowerShell:

```powershell
$env:GITHUB_TOKEN = "github_pat_replace_me"
```

A variável precisa existir no mesmo terminal em que o npm será executado.

### 5. Instale uma versão publicada

Para instalar uma versão específica:

```bash
npm install @maumenvi/saas-br-kit@1.0.0
```

Para instalar a versão mais recente disponível:

```bash
npm install @maumenvi/saas-br-kit
```

O `package.json` da aplicação passará a conter
`@maumenvi/saas-br-kit` em `dependencies`.

### 6. Importe no TypeScript

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

Não use:

```ts
// Incorreto: caminhos internos não fazem parte da API pública.
import { Application } from '@maumenvi/saas-br-kit/dist/index.js';
```

### Uso em GitHub Actions

O package precisa conceder acesso ao repositório consumidor. Com esse acesso
configurado, o `GITHUB_TOKEN` do próprio workflow pode instalar a dependência:

```yaml
permissions:
  contents: read
  packages: read

steps:
  - uses: actions/checkout@v6
  - uses: actions/setup-node@v4
    with:
      node-version: 24
      cache: npm
  - name: Install dependencies
    run: npm ci
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

O `.npmrc` do projeto continuará usando `${GITHUB_TOKEN}` durante o workflow.

### Erros comuns

- `E401`: token ausente, expirado ou sem `read:packages`;
- `E403`: sua conta ou o repositório consumidor não tem acesso ao package;
- `E404`: nome ou versão incorretos, ou package privado não visível para a conta;
- falha com SSO: autorize o token classic para a organização.

Confira o registry configurado:

```bash
npm config get @maumenvi:registry
npm view @maumenvi/saas-br-kit versions
```

Veja [Publicação e instalação](./docs/publishing.md) para o processo de release
manual, permissões e configuração de visibilidade.

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

A biblioteca é empacotada como ESM e publica JavaScript e declarations em
`dist/`. Para aplicações consumidoras, o ponto de entrada documentado é somente
o package privado no GitHub Packages. O release é iniciado manualmente pelo
workflow `Release package`.
