# Casos de uso

Este catálogo descreve a facade `Application`. Para composition roots
avançadas, as classes de use case e as compositions também são exportadas, mas
a facade é o ponto de entrada recomendado.

## Como ler as assinaturas

Todo método exposto é um `Handler<Input, Output>`:

```ts
const output = await handler(input);
```

Use cases de comando normalmente retornam `void`. Consultas retornam entidade,
lista ou `null`. Erros são lançados como `DomainError`.

## Facades públicas

Não exigem `withPermission`, mas a API consumidora ainda deve aplicar
rate limiting e decidir quem pode chamar cada rota.

### Tenant

```ts
application.tenant.resolve(slug)
```

- normaliza e valida o slug;
- rejeita slug reservado;
- retorna `{ organizationId, slug }` quando a organização está habilitada;
- retorna `null` quando não existe ou está desabilitada;
- não retorna a entidade completa.

### Auth

```ts
application.auth.authenticate(input)
```

- autentica com a estratégia configurada;
- resolve membership pelo actor e organização;
- exige MFA quando existe uma configuração ativa para `USER`;
- cria o token com identidade confiável;
- retorna `{ token, membership }`.

Veja [Autenticação](./authentication-and-permissions.md#autenticação).

### Registration

```ts
application.registration.createOrganization(input)
```

Cria organização, actor `USER` quando necessário e membership owner na mesma
transação. Retorna:

```ts
{
  actorId: string;
  organizationId: string;
  membershipId: string;
}
```

Outros handlers:

| Handler | Entrada | Resultado |
| --- | --- | --- |
| `sendOrganizationWelcomeEmail` | `{ actorId, organizationId }` | envia intenção ao port |
| `requestEmailConfirmation` | `{ actorId }` | cria verification e retorna credential |
| `requestTelephoneConfirmation` | `{ actorId }` | cria verification e retorna credential |
| `sendEmailConfirmation` | actor + dados da verification | envia intenção ao port |
| `sendTelephoneConfirmation` | actor + dados da verification | envia intenção ao port |

Criação e envio são separados; nada é enviado automaticamente.

### Verification

```ts
application.verification.accept({
  verificationId,
  credential,
});
```

Aceita confirmação de email, telefone ou convite e executa o efeito de domínio
correspondente.

```ts
const count = await application.verification.expirePending();
```

Expira registros pendentes vencidos e retorna a quantidade. Esse handler pode
ser chamado por cron ou worker.

### Resposta pública de appointment

```ts
application.appointment.respond({
  verificationId,
  credential,
  action: 'CONFIRM',
});
```

`action` pode ser `CONFIRM` ou `CANCEL`. O output contém `appointmentId`,
`action` e `respondedAt`. A credential expira duas horas antes do início.

## Facade protegida

```ts
const app = application.withPermission(membership);
```

Cada operação verifica uma `PermissionKey` e o escopo da organização quando
aplicável.

## Actor

```ts
app.actor
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `actor:create` | `Actor -> void` |
| `update` | `actor:update` | `Actor -> void` |
| `changeStatus` | `actor:change-status` | `Actor -> void` |
| `findById` | `actor:find` | `string -> Actor \| null` |
| `findByEmail` | `actor:find` | `string -> UserActor \| null` |
| `findByTelephone` | `actor:find` | `string -> UserActor \| null` |
| `findByName` | `actor:find` | `string -> Actor[]` |
| `sendOrganizationWelcomeEmail` | `organization:create` | comando de mensagem |
| `sendOrganizationInvitationEmail` | `membership:create` | comando de mensagem |
| `requestEmailConfirmation` | `actor:update` | cria verification |
| `requestTelephoneConfirmation` | `actor:update` | cria verification |
| `sendEmailConfirmation` | `actor:update` | comando de mensagem |
| `sendTelephoneConfirmation` | `actor:update` | comando de mensagem |

Tipos de actor:

```ts
type ActorType = 'USER' | 'CLIENT' | 'SERVICE';
```

Somente `USER` possui `Email`, `Telephone`, `passwordHash` e flags de
confirmação. Criação e atualização validam os value objects antes da transação.

## Organization

```ts
app.organization
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `organization:create` | `Organization -> void` |
| `update` | `organization:update` | `Organization -> void` |
| `changeStatus` | `organization:change-status` | `Organization -> void` |
| `findById` | `organization:find` | `string -> Organization \| null` |
| `findByCnpj` | `organization:find` | `string -> Organization \| null` |

`findBySlug` existe em `OrganizationComposition`, mas a facade principal usa
`tenant.resolve` para não expor uma organização completa antes da autenticação.

Criação e atualização validam CNPJ, slug, reserva e duplicidade.

## Membership

```ts
app.membership
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `membership:create` | `Membership -> void` |
| `update` | `membership:update` | `Membership -> void` |
| `changeStatus` | `membership:change-status` | `Membership -> void` |
| `findById` | `membership:find` | `string -> Membership \| null` |
| `findByOrganizationId` | `membership:find` | `string -> Membership[]` |
| `findByActorId` | `membership:find` | `string -> Membership[]` |
| `requestOrganizationInvitation` | `membership:create` | `Membership -> verification` |

A criação direta exige actor e organização habilitados. O convite persiste a
membership dentro da verification e só a cria no aceite.

## MFA

```ts
app.mfa
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `createKey` | membership confiável | `void -> { secret, provisioningUri }` |
| `validateCode` | membership confiável | `{ code } -> { valid: true, activated }` |

O actor vem do membership confiável e o cliente não escolhe `actorId`. Esses
dois handlers não exigem uma chave específica do catálogo; a proteção atual é
o membership usado para criar a facade.

## Service

```ts
app.service
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `service:create` | `CreateServiceInput -> void` |
| `update` | `service:update` | `Service -> void` |
| `changeStatus` | `service:change-status` | `Service -> void` |
| `findById` | `service:find` | `{ organizationId, id } -> Service \| null` |
| `findByName` | `service:find` | `{ organizationId, name } -> Service[]` |
| `findByOrganizationId` | `service:find` | `organizationId -> Service[]` |
| `findByOneOrMoreIncludedServices` | `service:find` | tenant + ids -> `Service[]` |

Regras:

- `price` é inteiro em centavos;
- `durationMinutes` é inteiro positivo;
- `includedServiceIds` usa `[]` como padrão;
- serviços incluídos devem existir no mesmo tenant.

## Customer

```ts
app.customer
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `customer:create` | `Customer -> void` |
| `update` | `customer:update` | `Customer -> void` |
| `changeStatus` | `customer:change-status` | `Customer -> void` |
| `anonymize` | `customer:update` | `{ organizationId, customerId } -> void` |
| `findById` | `customer:find` | `{ organizationId, id } -> Customer \| null` |
| `findByName` | `customer:find` | `{ organizationId, value } -> Customer[]` |
| `findByEmail` | `customer:find` | `{ organizationId, value } -> Customer[]` |
| `findByTelephone` | `customer:find` | `{ organizationId, value } -> Customer[]` |
| `findByOrganizationId` | `customer:find` | `organizationId -> Customer[]` |

`documentType` pode ser `cpf`, `cnpj`, `passport` ou `other`. Quando o tipo é
informado, o documento é obrigatório. A anonimização mascara documento, email
e telefone, preservando os dois últimos caracteres.

## Plan

```ts
app.plan
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `plan:create` | `Plan -> void` |
| `update` | `plan:update` | `Plan -> void` |
| `changeStatus` | `plan:change-status` | `Plan -> void` |
| `findById` | `plan:find` | `{ organizationId, id } -> Plan \| null` |
| `findByName` | `plan:find` | `{ organizationId, name } -> Plan[]` |
| `findByOrganizationId` | `plan:find` | `organizationId -> Plan[]` |
| `findByOneOrMoreServices` | `plan:find` | tenant + ids -> `Plan[]` |

Cada item do plano é `{ serviceId, quantity }`. Quantidade deve ser inteira
positiva e o serviço precisa pertencer ao tenant.

## Subscription

```ts
app.subscription
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `subscription:create` | `CreateSubscriptionInput -> void` |
| `update` | `subscription:update` | `Subscription -> void` |
| `changeStatus` | `subscription:change-status` | `Subscription -> void` |
| `renew` | `subscription:update` | renew input -> `void` |
| `findById` | `subscription:find` | `{ organizationId, id } -> Subscription \| null` |
| `findByCustomerId` | `subscription:find` | tenant + relation id -> lista |
| `findByPlanId` | `subscription:find` | tenant + relation id -> lista |
| `findByOrganizationId` | `subscription:find` | `organizationId -> lista` |

Na criação:

- customer e plan precisam pertencer à organização;
- `usedServices` é derivado do plano com `used = 0`;
- `lastPayment` começa em `createdAt`;
- `nextPayment` soma `recurrenceDays`;
- `paymentProvider` usa `local` quando omitido.

Renovação atualiza datas e zera consumo.

## Appointment

```ts
app.appointment
```

| Handler | Permission | Entrada/saída |
| --- | --- | --- |
| `create` | `appointment:create` | `CreateAppointmentInput -> void` |
| `update` | `appointment:update` | `UpdateAppointmentInput -> void` |
| `changeStatus` | `appointment:change-status` | `Appointment -> void` |
| `cancel` | `appointment:cancel` | `{ appointmentId, organizationId } -> void` |
| `requestResponse` | `appointment:update` | ids -> verification |
| `sendEmail` | `appointment:update` | ids -> `void` |
| `sendTelephone` | `appointment:update` | ids -> `void` |
| `sendResponseEmail` | `appointment:update` | ids + credential -> `void` |
| `sendResponseTelephone` | `appointment:update` | ids + credential -> `void` |
| `findById` | `appointment:find` | `{ organizationId, id } -> Appointment \| null` |
| `findByOrganizationId` | `appointment:find` | tenant -> lista |
| `findByDatetime` | `appointment:find` | tenant + intervalo -> lista |
| `findByCustomerId` | `appointment:find` | tenant + customer -> lista |

Regras principais:

- calcula `datetimeFinal` pelas durações quando omitido;
- impede sobreposição com appointments não cancelados;
- exige subscription e pagamento em dia no fluxo de plano;
- consome saldo ao agendar;
- estorna saldo ao atualizar serviços ou cancelar;
- calendário opcional é sincronizado depois da persistência;
- mensagens e solicitação de resposta são comandos explícitos.

Não use `changeStatus` para cancelar e contornar o estorno. Use `cancel` ou a
resposta pública.

## Use cases diretos

Classes como `CreateActorUseCase`, `CreatePlanUseCase` e
`RespondAppointmentUseCase` são exportadas para composition roots avançadas.
Ao usá-las diretamente, você assume a responsabilidade de:

- injetar todas as dependências corretas;
- adicionar erro, auditoria, permission e idempotência quando aplicáveis;
- preservar o isolamento por tenant;
- não expor queries internas por engano.

Para uma API comum, prefira `Application`.
