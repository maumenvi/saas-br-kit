# Ports

Port é um contrato que descreve o que o Core precisa sem escolher como isso será
feito. O consumidor implementa o port em um adapter e o injeta na composição.

## Visão geral

| Port | Obrigatório em `Application` | Responsabilidade |
| --- | --- | --- |
| `DatabasePort` | sim | operação transacional |
| `LoggerPort` | sim | logs técnicos |
| `PasswordHashPort` | sim | hash e verificação de senha |
| `TokenPort<Output>` | sim | criação de token |
| repositories dos agregados | sim | persistência e consultas |
| `AuditRepositoryPort` | sim | auditoria append-only |
| `MfaRepositoryPort` | sim | estado e contador MFA |
| `MfaProviderPort` | sim | TOTP concreto |
| `VerificationRepositoryPort` | sim | lifecycle de verification |
| `VerificationCredentialPort` | sim | emitir e verificar credential |
| policies | sim | decisões específicas do produto |
| `ClockPort` | não | relógio testável |
| `IdGeneratorPort` | não | geração de ids |
| `SendEmailPort` | não | envio de intenções de email |
| `SendTelefoneMessagePort` | não | SMS/WhatsApp/telefone |
| `CalendarIntegrationPort` | não | sincronização de appointment |
| `IdempotencyPort` | não | reservar e reproduzir execução |

## Persistência

### DatabasePort

```ts
interface DatabasePort {
  run<T>(
    callback: (transaction: unknown) => Promise<T>,
  ): Promise<T>;
}
```

O callback delimita uma unidade transacional. Seu adapter deve:

- abrir uma transação;
- fazer com que os repositories chamados usem essa transação;
- commitar somente quando o callback terminar;
- fazer rollback quando o callback lançar;
- relançar o erro original ou um erro mapeado.

O parâmetro `transaction` existe no contrato, mas os use cases atuais não o
recebem diretamente nos métodos dos repositories. O adapter consumidor precisa
propagar o contexto transacional por sua estratégia de infraestrutura, por
exemplo unit of work ou contexto assíncrono.

### RepositoryPort

```ts
interface RepositoryPort<Entity> {
  save(entity: Entity): Promise<void>;
  changeStatus(entity: Entity): Promise<void>;
  update(entity: Entity): Promise<void>;
  findById(id: string): Promise<Entity | null>;
}
```

Essas são operações comuns. Consultas com significado de domínio ficam no
repository específico.

Regras para adapters:

- retorne `null` quando `findById` não encontra;
- não converta ausência em objeto vazio;
- preserve `Date` como `Date` na fronteira do Core;
- mantenha constraints únicas também no banco;
- em consultas multi-tenant, sempre filtre por `organizationId`;
- operações atômicas devem ser atômicas no banco, não “buscar e depois salvar”.

### ActorRepositoryPort

Além do contrato comum:

```ts
findByEmail(email: string): Promise<UserActor | null>;
findByTelephone(telephone: string): Promise<UserActor | null>;
findByName(name: string): Promise<Actor[]>;
confirmEmail(
  actorId: string,
  email: string,
  verifiedAt: Date,
): Promise<boolean>;
confirmTelephone(
  actorId: string,
  telephone: string,
  verifiedAt: Date,
): Promise<boolean>;
```

`confirmEmail` e `confirmTelephone` retornam `false` quando não foi possível
confirmar exatamente o contato atual. Faça a condição no update do banco para
evitar confirmar um endereço que mudou depois da solicitação.

### OrganizationRepositoryPort

```ts
findByCnpj(cnpj: string): Promise<Organization | null>;
findBySlug(slug: string): Promise<Organization | null>;
```

Persista CNPJ e slug em forma canônica e use índices únicos. O Core consulta
duplicidade, mas isso não substitui a constraint contra concorrência.

### MembershipRepositoryPort

```ts
findByOrganizationId(organizationId: string): Promise<Membership[]>;
findByActorId(actorId: string): Promise<Membership[]>;
findByActorOrganizationId(
  actorId: string,
  organizationId: string,
): Promise<Membership | null>;
```

A última consulta é usada pela autenticação. Garanta unicidade da combinação
actor + organização conforme a regra do produto.

### ServiceRepositoryPort

```ts
findByName(organizationId: string, name: string): Promise<Service[]>;
findByOrganizationId(organizationId: string): Promise<Service[]>;
findByOneOrMoreIncludedServices(
  organizationId: string,
  serviceIds: string[],
): Promise<Service[]>;
```

A consulta de serviços incluídos usa semântica “qualquer um dos ids”.

### CustomerRepositoryPort

```ts
findByName(organizationId: string, name: string): Promise<Customer[]>;
findByEmail(organizationId: string, email: string): Promise<Customer[]>;
findByTelephone(
  organizationId: string,
  telephone: string,
): Promise<Customer[]>;
findByOrganizationId(organizationId: string): Promise<Customer[]>;
```

Todas as consultas são isoladas pelo tenant.

### PlanRepositoryPort

```ts
findByName(organizationId: string, name: string): Promise<Plan[]>;
findByOrganizationId(organizationId: string): Promise<Plan[]>;
findByOneOrMoreServices(
  organizationId: string,
  serviceIds: string[],
): Promise<Plan[]>;
```

A consulta de serviços usa semântica “qualquer um”.

### SubscriptionRepositoryPort

```ts
findByCustomerId(
  organizationId: string,
  customerId: string,
): Promise<Subscription[]>;
findByPlanId(
  organizationId: string,
  planId: string,
): Promise<Subscription[]>;
findByOrganizationId(organizationId: string): Promise<Subscription[]>;
```

Um customer pode possuir várias subscriptions.

### AppointmentRepositoryPort

```ts
findByOrganizationId(organizationId: string): Promise<Appointment[]>;
findByDatetime(
  organizationId: string,
  datetimeInitial: Date,
  datetimeFinal: Date,
): Promise<Appointment[]>;
findByCustomerId(
  organizationId: string,
  customerId: string,
): Promise<Appointment[]>;
```

`findByDatetime` deve retornar candidatos que possam se sobrepor ao intervalo.
O Core aplica a regra final e ignora appointments cancelados.

### AuditRepositoryPort

```ts
interface AuditRepositoryPort {
  save(audit: Audit): Promise<void>;
}
```

Auditoria é append-only: não há update ou delete no port. O interceptor dispara
`save` sem bloquear o retorno. Se você precisa garantia de entrega, faça o
adapter publicar rapidamente em uma fila durável.

### MfaRepositoryPort

```ts
interface MfaRepositoryPort {
  save(mfa: Mfa): Promise<void>;
  findByActorId(actorId: string): Promise<Mfa | null>;
  findActiveByActorId(actorId: string): Promise<Mfa | null>;
  activate(id: string, counter: number, updatedAt: Date): Promise<boolean>;
  consumeCounter(
    id: string,
    counter: number,
    updatedAt: Date,
  ): Promise<boolean>;
}
```

`activate` e `consumeCounter` precisam ser updates condicionais atômicos.
Aceite somente contador maior que o último. Garanta no banco no máximo uma
configuração `PENDING` ou `ACTIVE` por actor.

### VerificationRepositoryPort

```ts
interface VerificationRepositoryPort<MembershipStatus, MembershipExtra> {
  save(verification: Verification): Promise<void>;
  findById(id: string): Promise<Verification | null>;
  acceptIfPending(id: string, acceptedAt: Date): Promise<boolean>;
  expireIfPending(id: string, expiredAt: Date): Promise<boolean>;
  expirePending(expiresAt: Date): Promise<number>;
  expirePendingFor(
    target: VerificationTarget,
    expiredAt: Date,
  ): Promise<number>;
  registerFailedAttempt(
    id: string,
    attemptedAt: Date,
  ): Promise<RegisterVerificationAttemptResult | null>;
}
```

Transições condicionadas precisam ser atômicas. A credential bruta nunca deve
ser armazenada; persista apenas `credentialHash`.

## Segurança

### PasswordHashPort

```ts
interface PasswordHashPort {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}
```

Use um algoritmo de senha, como Argon2id ou bcrypt, com parâmetros adequados ao
seu ambiente. Não use hash rápido genérico. Nunca registre senha ou hash.

### TokenPort\<Output>

```ts
interface TokenPort<Output> {
  readonly payload: Payload;
  readonly config: unknown;
  readonly refreshPayload: unknown;
  readonly refreshConfig: unknown;
  createToken(payload: unknown, config: unknown): Output;
  generateToken(payload: unknown, config: unknown): Promise<string>;
  verifyToken(token: string): Promise<unknown>;
  generateRefreshToken(
    refreshPayload: unknown,
    refreshConfig: unknown,
  ): Promise<string>;
  verifyRefreshToken(token: string): Promise<unknown>;
}
```

`Payload` exige `actorId` e `organizationId` e aceita outros campos. O auth
substitui a identidade pelos valores confiáveis antes de chamar `createToken`.
`Output` pode ser string ou objeto.

### AuthPort\<Input>

```ts
interface AuthPort<Input> {
  authenticate(input: Input): Promise<{
    actorId: string;
    actorType: 'USER' | 'CLIENT' | 'SERVICE';
  } | null>;
}
```

Retorne `null` quando a credencial não autentica. Não retorne membership nem
token; o Core resolve o membership e chama `TokenPort`.

`LOGIN` é implementado internamente com actor repository e password hash.
`CREDENTIALS`, `OAUTH`, `API_KEY` e `CUSTOM` exigem um `AuthPort` externo.

### MfaProviderPort

```ts
interface MfaProviderPort {
  createKey(input: {
    issuer: string;
    label: string;
  }): Promise<{
    secret: string;
    provisioningUri: string;
    providerCredential: string;
  }>;

  validateCode(input: {
    providerCredential: string;
    code: string;
  }): Promise<
    | { valid: false }
    | { valid: true; counter: number }
  >;
}
```

`providerCredential` é o formato opaco persistido. Proteja-o em repouso. O
segredo e a URI só voltam no enrollment.

### VerificationCredentialPort

```ts
interface VerificationCredentialPort {
  issue(purpose: VerificationPurpose): Promise<{
    value: string;
    hash: string;
  }>;
  verify(value: string, hash: string): Promise<boolean>;
}
```

`value` é enviado ao usuário; `hash` é persistido. Gere valores imprevisíveis,
compare de forma segura e não reutilize credentials.

## Policies e queries de validação

### ActorStatusPolicyPort

```ts
isEnabled(status: ActorStatus): boolean;
```

### OrganizationStatusPolicyPort

```ts
isEnabled(status: OrganizationStatus): boolean;
```

### OrganizationSlugPolicyPort

```ts
isReserved(slug: string): boolean;
```

Use para nomes como `www`, `api`, `admin` e `auth`.

### SubscriptionPaymentStatusPolicyPort

```ts
isPaymentCurrent(subscription: Subscription, now: Date): boolean;
```

O Core usa a decisão ao consumir saldo de plano em appointment.

### AppointmentStatusPolicy

```ts
interface AppointmentStatusPolicy<Status> {
  isCancelled(status: Status): boolean;
  cancelledByCustomerStatus: Status;
  cancelledByActorStatus: Status;
}
```

### ActorValidationQueryPort e OrganizationValidationQueryPort

São projeções mínimas usadas entre módulos. As compositions padrão as montam a
partir dos repositories e policies. Normalmente um consumidor de `Application`
não precisa implementá-las manualmente.

## Mensagens

### SendEmailPort

```ts
interface SendEmailPort {
  sendEmail(input: SendEmailInput): Promise<void>;
}
```

`SendEmailInput` é uma união discriminada por `type`:

- `ORGANIZATION_WELCOME`;
- `ORGANIZATION_INVITATION`;
- `EMAIL_CONFIRMATION`;
- `APPOINTMENT_NOTIFICATION`;
- `APPOINTMENT_RESPONSE`.

O adapter decide assunto, template, link e provedor. Use um `switch` exaustivo:

```ts
async function sendEmail(input: SendEmailInput): Promise<void> {
  switch (input.type) {
    case 'ORGANIZATION_WELCOME':
      return sendWelcomeTemplate(input);
    case 'ORGANIZATION_INVITATION':
      return sendInvitationTemplate(input);
    case 'EMAIL_CONFIRMATION':
      return sendConfirmationTemplate(input);
    case 'APPOINTMENT_NOTIFICATION':
      return sendAppointmentTemplate(input);
    case 'APPOINTMENT_RESPONSE':
      return sendAppointmentResponseTemplate(input);
  }
}
```

### SendTelefoneMessagePort

O nome público atual preserva a grafia `Telefone`:

```ts
interface SendTelefoneMessagePort {
  sendMessage(input: SendTelephoneMessageInput): Promise<void>;
}
```

Tipos:

- `TELEPHONE_CONFIRMATION`;
- `APPOINTMENT_NOTIFICATION`;
- `APPOINTMENT_RESPONSE`.

O mesmo port pode ser adaptado para SMS ou WhatsApp.

## CalendarIntegrationPort

```ts
interface CalendarIntegrationPort {
  upsertAppointment(input: CalendarAppointmentInput): Promise<void>;
  cancelAppointment(input: CalendarAppointmentInput): Promise<void>;
}
```

A sincronização acontece depois da persistência. Falha do calendário gera
warning e não desfaz o appointment. Use `appointmentId` como chave idempotente
no provedor externo.

## IdempotencyPort

```ts
interface IdempotencyPort {
  acquire<Input, Output>(
    execution: IdempotencyExecution<Input>,
  ): Promise<
    | { status: 'ACQUIRED'; leaseId: string }
    | { status: 'REPLAY'; output: Output }
    | { status: 'IN_PROGRESS' }
  >;
  complete<Output>(completion: IdempotencyCompletion<Output>): Promise<void>;
  release(release: IdempotencyRelease): Promise<void>;
}
```

O interceptor calcula `fingerprint` e `key`. O adapter decide storage e TTL.

Fluxo:

1. `ACQUIRED`: reserve e devolva uma `leaseId`;
2. sucesso: `complete` persiste o output;
3. erro do handler: `release` libera a reserva;
4. `REPLAY`: a lib retorna o output sem executar novamente;
5. `IN_PROGRESS`: a lib lança `IDEMPOTENCY_IN_PROGRESS`.

`complete` e `release` só podem alterar a reserva se `leaseId`, `key` e
`fingerprint` ainda correspondem. Se `complete` falhar, a lib não chama
`release`; o TTL do adapter deve limpar a reserva abandonada.

## Relógio, ids e logs

```ts
type ClockPort = () => Date;
type IdGeneratorPort = () => string;
```

Se omitidos, a lib usa `new Date()` e `crypto.randomUUID()`. Injete versões
determinísticas em testes.

`LoggerPort` contém `error`, `warn`, `info` e `debug`. Não lance erro a partir
do logger e não registre secrets.

## TransactionPort

`TransactionPort` também é exportado pelo shared:

```ts
interface TransactionPort {
  run<Result>(operation: () => Promise<Result>): Promise<Result>;
}
```

O contexto principal usa `DatabasePort`. Trate `TransactionPort` como contrato
compartilhado para compositions avançadas; ele não substitui o
`executionContextInput.databaseProvider` da facade atual.

