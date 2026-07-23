# Arquitetura

## Princípio central

As regras dependem de contratos; implementações concretas dependem das regras.
Por isso, o Core não importa framework, ORM, banco, logger ou SDK externo.

```text
API HTTP / worker / CLI
          |
          v
     Application
          |
          v
      composition
          |
          v
      interceptors
          |
          v
       use case
          |
          v
         port <--- adapter do consumidor
```

## Camadas

### Core

`src/core/` contém:

- entidades e value objects;
- erros de domínio;
- casos de uso;
- ports de infraestrutura e repositories;
- policies fornecidas pelo consumidor;
- contextos;
- controle de acesso;
- contratos de handler e interceptor.

Uma regra do Core pode chamar um port, mas nunca conhece a classe concreta que o
implementa.

### Composition

`src/composition/` instancia use cases, injeta dependências e monta o pipeline
de interceptors. A entrada principal é `Application`.

A facade pública expõe operações que podem ocorrer antes de existir uma sessão:

```ts
application.auth.authenticate
application.registration.createOrganization
application.tenant.resolve
application.verification.accept
application.verification.expirePending
application.appointment.respond
```

As operações administrativas ficam atrás de um membership confiável:

```ts
const protectedApplication = application.withPermission(membership);

protectedApplication.actor;
protectedApplication.organization;
protectedApplication.membership;
protectedApplication.mfa;
protectedApplication.service;
protectedApplication.customer;
protectedApplication.plan;
protectedApplication.subscription;
protectedApplication.appointment;
```

`withPermission` não valida token. O consumidor deve obter o membership de uma
autenticação confiável ou reidratá-lo depois de verificar uma sessão.

### Adapters

Adapters pertencem à aplicação consumidora. Exemplos:

- `PrismaDatabaseAdapter implements DatabasePort`;
- `PostgresActorRepository implements ActorRepositoryPort`;
- `Argon2PasswordHashAdapter implements PasswordHashPort`;
- `JwtTokenAdapter implements TokenPort`;
- `RedisIdempotencyAdapter implements IdempotencyPort`;
- `SmtpEmailAdapter implements SendEmailPort`.

## Contextos

`ExecutionContext` agrupa providers técnicos usados durante uma execução:

```text
DatabasePort              obrigatório
LoggerPort                obrigatório
PasswordHashPort          obrigatório
ClockPort                 default: new Date()
IdGeneratorPort           default: crypto.randomUUID()
SendEmailPort             opcional
SendTelefoneMessagePort   opcional
CalendarIntegrationPort   opcional
IdempotencyPort           opcional
```

`AppContext` combina esse contexto com repositories, autenticação, MFA,
verification e policies. Na facade `Application`, ele é privado.

## Status e campos extras

O Core não define status de negócio:

```ts
type Statuses = {
  actors: 'active' | 'inactive';
  organizations: 'enabled' | 'blocked';
  memberships: 'active' | 'revoked';
  services: 'active' | 'archived';
  customers: 'active' | 'anonymized';
  plans: 'active' | 'inactive';
  subscriptions: 'active' | 'overdue';
  appointments: 'scheduled' | 'cancelled';
};
```

Não una status diferentes só para reduzir generics. As policies traduzem cada
status concreto para decisões que o Core entende, como `isEnabled`.

`Extras` permite que um adapter acrescente campos persistidos:

```ts
type Extras = {
  actors: { externalId?: string };
  organizations: { timezone: string };
  memberships: unknown;
  services: unknown;
  customers: unknown;
  plans: unknown;
  subscriptions: { invoiceId?: string };
  appointments: { notes?: string };
};
```

## Handler, interceptor e pipe

Um handler é uma função assíncrona:

```ts
type Handler<Input, Output> = (input: Input) => Promise<Output>;
```

Um interceptor envolve o próximo handler:

```ts
interface Interceptor<Input, Output> {
  intercept(
    input: Input,
    next: Handler<Input, Output>,
  ): Promise<Output>;
}
```

O pipeline padrão é:

```text
error -> audit -> permission -> idempotency -> handler
```

Efeitos dessa ordem:

- erros são registrados e relançados;
- tentativas negadas também geram auditoria;
- permission é verificada antes de reservar idempotência;
- o handler só abre a transação depois dessas verificações.

Nem todo handler usa todas as etapas. Permission aparece apenas na facade
protegida. Idempotência aparece apenas quando o port foi injetado e o handler a
permite. Criação de chave MFA, geração de credentials de verification e envios
de mensagem desativam idempotência.

## Transações

Use cases de escrita delimitam persistência com:

```ts
await executionContext.databaseProvider.run(async () => {
  await repository.save(entity);
});
```

O adapter deve garantir que todos os repositories usados no callback
participem da mesma transação. Value objects são validados antes de abrir a
operação quando aplicável. Erros são propagados para que o adapter faça rollback.

Efeitos externos, como calendário e mensagens, não devem fingir que fazem parte
de uma transação SQL. Cada fluxo documenta quando o efeito acontece.

## Multi-tenant

Actor é identidade. Organization é tenant. Membership liga ambos e contém as
permissions.

```text
hostname confiável
      |
      v
tenant.resolve(slug)
      |
      v
organizationId confiável
      |
      v
auth.authenticate(...)
      |
      v
membership
      |
      v
withPermission(membership)
```

O hostname não autoriza sozinho. O membership autenticado deve pertencer à
organização resolvida. Consultas dos módulos organizacionais carregam
`organizationId` e as fachadas verificam o escopo.

## Superfície pública e imports internos

`src/index.ts` reexporta `core` e `composition`. Internamente, cada arquivo
importa diretamente o arquivo proprietário do símbolo e inclui `.ts`.

Não faça isto dentro da lib:

```ts
import { Email } from '../actor/index.ts';
```

Faça:

```ts
import { Email } from '../actor/domain/email.ts';
```

O consumidor usa somente `@maumenvi/saas-br-kit` ou o subpath público
`@maumenvi/saas-br-kit/mocks`. O mapa `exports` impede dependência acidental de
arquivos internos.
