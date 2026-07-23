# Catálogo, subscriptions e appointments

Este fluxo pertence à facade protegida:

```ts
const app = application.withPermission(session.membership);
const organizationId = session.membership.organizationId;
```

## Criar um serviço

```ts
const now = new Date();

await app.service.create({
  id: crypto.randomUUID(),
  organizationId,
  name: 'Consulta',
  description: 'Consulta de 50 minutos',
  price: 15_000,
  durationMinutes: 50,
  createdAt: now,
  updatedAt: now,
  status: 'active',
});
```

Preço é inteiro em centavos. `includedServiceIds` é opcional na criação e usa
lista vazia como padrão.

Serviço composto:

```ts
await app.service.create({
  // campos comuns
  includedServiceIds: [serviceIdA, serviceIdB],
});
```

Cada referência precisa existir na mesma organização.

## Criar um customer

```ts
await app.customer.create({
  id: crypto.randomUUID(),
  organizationId,
  name: 'João',
  email: 'joao@example.com',
  telephone: '+5511999999999',
  documentType: 'cpf',
  document: '529.982.247-25',
  createdAt: now,
  updatedAt: now,
  status: 'active',
});
```

Regras de documento:

- `cpf`, `cnpj` e `passport` são validados;
- `other` aceita texto livre;
- documento sem `documentType` não é validado;
- `documentType` sem documento falha.

Anonimização:

```ts
await app.customer.anonymize({
  organizationId,
  customerId,
});
```

O caso de uso mascara documento, email e telefone. Sua legislação, retenção,
anonimização de outros campos e trilha jurídica continuam no consumidor.

## Criar um plano

```ts
await app.plan.create({
  id: crypto.randomUUID(),
  organizationId,
  name: 'Mensal',
  price: 40_000,
  services: [
    { serviceId: consultationId, quantity: 4 },
  ],
  createdAt: now,
  updatedAt: now,
  status: 'active',
});
```

Serviços devem existir no tenant e quantidades devem ser inteiros positivos.

## Criar uma subscription

```ts
await app.subscription.create({
  id: crypto.randomUUID(),
  organizationId,
  customerId,
  planId,
  price: 40_000,
  recurrenceDays: 30,
  createdAt: now,
  updatedAt: now,
  status: 'active',
});
```

O Core deriva:

```text
usedServices     itens do plano com used = 0
lastPayment      createdAt
nextPayment      createdAt + recurrenceDays
paymentProvider  "local" quando omitido
```

Renovar:

```ts
await app.subscription.renew({
  subscriptionId,
  organizationId,
  paymentDate: new Date(),
});
```

A renovação atualiza as datas e zera os consumos. Cobrança e confirmação do
gateway de pagamento acontecem antes, no consumidor.

## Appointments

### Appointment avulso

```ts
await app.appointment.create({
  id: crypto.randomUUID(),
  organizationId,
  customerId,
  serviceIds: [consultationId],
  datetimeInitial: new Date('2026-08-10T14:00:00.000Z'),
  paymentType: 'pix',
  isPlanService: false,
  createdAt: now,
  updatedAt: now,
  status: 'scheduled',
});
```

Quando `datetimeFinal` é omitido, o Core soma `durationMinutes` dos serviços.
No fluxo avulso:

- `subscriptionId` é proibido;
- `paymentType: 'subscription'` é proibido;
- `paymentProvider` usa valor default definido pelo caso de uso.

### Appointment de plano

```ts
await app.appointment.create({
  id: crypto.randomUUID(),
  organizationId,
  customerId,
  serviceIds: [consultationId],
  subscriptionId,
  datetimeInitial: new Date('2026-08-10T14:00:00.000Z'),
  paymentType: 'subscription',
  isPlanService: true,
  createdAt: now,
  updatedAt: now,
  status: 'scheduled',
});
```

O Core verifica:

- subscription pertence ao customer e organização;
- pagamento está em dia segundo a policy;
- cada serviço existe e tem saldo;
- não há sobreposição;
- consumo é atualizado na mesma operação transacional.

### Sobreposição

Intervalos usam começo inclusivo e fim exclusivo:

```text
[14:00, 15:00) e [15:00, 16:00) não se sobrepõem
[14:00, 15:00) e [14:30, 15:30) se sobrepõem
```

Appointments cancelados não bloqueiam a agenda. Ao atualizar, o próprio
appointment é ignorado na checagem.

### Atualizar

```ts
await app.appointment.update({
  ...appointment,
  serviceIds: [otherServiceId],
  updatedAt: new Date(),
});
```

No fluxo de plano, a atualização estorna o consumo anterior e aplica o novo na
mesma transação.

### Cancelar como operador

```ts
await app.appointment.cancel({
  appointmentId,
  organizationId,
});
```

Esse fluxo:

- carrega e valida o tenant;
- impede segundo cancelamento;
- estorna saldo quando necessário;
- aplica `cancelledByActorStatus`;
- sincroniza o calendário depois da persistência.

Não substitua por `changeStatus`, pois ele não representa o workflow completo de
cancelamento.

### Pedir confirmação ao customer

```ts
const verification = await app.appointment.requestResponse({
  appointmentId,
  organizationId,
});
```

Depois envie pelo canal escolhido:

```ts
await app.appointment.sendResponseEmail({
  appointmentId,
  organizationId,
  verificationId: verification.verificationId,
  credential: verification.credential,
  expiresAt: verification.expiresAt,
});
```

Ou:

```ts
await app.appointment.sendResponseTelephone({
  appointmentId,
  organizationId,
  verificationId: verification.verificationId,
  credential: verification.credential,
  expiresAt: verification.expiresAt,
});
```

Enviar aviso sem resposta:

```ts
await app.appointment.sendEmail({ appointmentId, organizationId });
await app.appointment.sendTelephone({ appointmentId, organizationId });
```

Nenhuma mensagem é automática.

### Resposta pública

```ts
await application.appointment.respond({
  verificationId,
  credential,
  action: 'CONFIRM',
});
```

Confirmação grava `confirmedAt`. Cancelamento aplica
`cancelledByCustomerStatus` e estorna saldo. A credential deixa de valer duas
horas antes do início.

## Calendário

Quando `CalendarIntegrationPort` foi injetado:

- create e update chamam `upsertAppointment`;
- cancel chama `cancelAppointment`;
- o efeito ocorre depois da persistência;
- falha externa gera warning;
- falha externa não desfaz o banco.

Faça o adapter idempotente por `appointmentId` e trate retry fora da transação.

## Consultas seguras

Sempre forneça o tenant da sessão:

```ts
const appointment = await app.appointment.findById({
  organizationId,
  id: appointmentId,
});
```

`findById` retorna `null` quando a entidade é de outro tenant. Repositories
também devem aplicar o filtro.
