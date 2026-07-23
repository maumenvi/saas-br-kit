# Registro, verification e MFA

## Registro público

O registro cria o primeiro tenant e seu owner sem exigir uma sessão anterior.

```ts
import {
  CNPJ,
  Email,
  OrganizationSlug,
  Telephone,
} from '@maumenvi/saas-br-kit';

const now = new Date();

const result = await application.registration.createOrganization({
  user: {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    name: 'Ana',
    email: new Email('ana@acme.com'),
    telephone: new Telephone('+5511999999999'),
    password: 'senha-recebida-no-request',
  },
  organization: {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    name: 'Acme',
    slug: new OrganizationSlug('acme'),
    cnpj: new CNPJ('90.021.382/0001-22'),
  },
  membership: {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
  },
});
```

O Core preenche:

- actor `type: 'USER'`;
- `passwordHash`;
- `emailVerified: false`;
- `telephoneVerified: false`;
- `organization.ownerActorId`;
- membership `role: 'owner'`;
- permissions `allow` para todo o catálogo atual.

Antes da transação, valida email, telefone, CNPJ, slug, reserva de slug e se os
status iniciais são habilitados. Na transação:

1. verifica CNPJ e slug duplicados;
2. procura actor pelo email;
3. cria o actor quando não existe;
4. cria a organização;
5. cria o membership owner.

Se o actor já existe, seus dados não são alterados. A senha recebida precisa
corresponder ao hash existente e o actor deve estar habilitado.

Mantenha constraints únicas no banco para email canônico, CNPJ e slug.

### Enviar boas-vindas

O registro não envia automaticamente:

```ts
await application.registration.sendOrganizationWelcomeEmail({
  actorId: result.actorId,
  organizationId: result.organizationId,
});
```

Se `sendEmailPort` não foi configurado, o comando falha com erro de provider
indisponível. A API decide se envia em linha, por job ou não envia.

## Verification

Verification mantém o lifecycle de uma credential de uso único:

```text
PENDING -> ACCEPTED
        -> REJECTED
        -> EXPIRED
```

Propósitos:

- `EMAIL_CONFIRMATION`;
- `TELEPHONE_CONFIRMATION`;
- `ORGANIZATION_INVITATION`;
- `APPOINTMENT_RESPONSE`.

A credential bruta só existe no retorno da criação. O repository recebe o hash.

### Configuração

```ts
verification: {
  credentialProvider,
  ttlMs: {
    EMAIL_CONFIRMATION: 15 * 60 * 1000,
    TELEPHONE_CONFIRMATION: 5 * 60 * 1000,
    ORGANIZATION_INVITATION: 7 * 24 * 60 * 60 * 1000,
  },
  maxAttempts: 5,
}
```

`APPOINTMENT_RESPONSE` não usa esse mapa; o vencimento é calculado a partir do
appointment.

### Solicitar confirmação de email

```ts
const verification =
  await application.registration.requestEmailConfirmation({
    actorId: result.actorId,
  });
```

O retorno contém `verificationId`, `credential` e `expiresAt`. Uma nova
solicitação expira a anterior pendente para o mesmo alvo.

### Enviar confirmação

```ts
await application.registration.sendEmailConfirmation({
  actorId: result.actorId,
  verificationId: verification.verificationId,
  credential: verification.credential,
  expiresAt: verification.expiresAt,
});
```

Request e envio são separados para permitir fila, retry e escolha de canal.
Não registre o valor de `credential`.

O telefone usa:

```ts
const verification =
  await application.registration.requestTelephoneConfirmation({
    actorId: result.actorId,
  });

await application.registration.sendTelephoneConfirmation({
  actorId: result.actorId,
  verificationId: verification.verificationId,
  credential: verification.credential,
  expiresAt: verification.expiresAt,
});
```

### Aceitar

```ts
const accepted = await application.verification.accept({
  verificationId: request.params.id,
  credential: request.body.credential,
});
```

O efeito depende do propósito:

- email: confirma somente se o email atual ainda é o destino;
- telefone: confirma somente se o telefone atual ainda é o destino;
- convite: cria a membership armazenada na verification;
- appointment: usa a facade específica `appointment.respond`.

Tentativa inválida incrementa o contador. Ao alcançar `maxAttempts`, o registro
vai para `REJECTED`.

### Expirar

Um worker pode chamar:

```ts
const expiredCount =
  await application.verification.expirePending();
```

O handler não agenda a si mesmo. Cron, worker e lock de execução pertencem ao
consumidor.

### Convite para organização

Na facade protegida:

```ts
const pending = await protectedApplication.membership
  .requestOrganizationInvitation({
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    organizationId,
    actorId,
    role: 'operator',
    permissions,
  });
```

O actor já precisa existir. A membership não é salva antes do aceite. Para
enviar:

```ts
await protectedApplication.actor.sendOrganizationInvitationEmail({
  actorId,
  organizationId,
  verificationId: pending.verificationId,
  credential: pending.credential,
  expiresAt: pending.expiresAt,
});
```

Convite para um email sem `UserActor` existente ainda não está implementado.

## MFA TOTP

MFA é disponível somente para actor `USER`.

### 1. Criar chave

```ts
const app = application.withPermission(session.membership);
const enrollment = await app.mfa.createKey();
```

Retorno:

```ts
{
  secret: string;
  provisioningUri: string;
}
```

Mostre QR code ou secret uma única vez. A lib persiste somente a
`providerCredential` opaca e cria o estado `PENDING`.

### 2. Confirmar primeiro código

```ts
const result = await app.mfa.validateCode({
  code: '123456',
});
```

No primeiro código válido:

- a configuração vai de `PENDING` para `ACTIVE`;
- o contador é salvo;
- o retorno contém `{ valid: true, activated: true }`.

Em configuração já ativa, um contador novo retorna `activated: false`. Reuso do
contador falha.

### 3. Login com MFA

```ts
const session = await application.auth.authenticate({
  authenticated: {
    email,
    password,
    organizationId,
  },
  mfaCode: '123456',
  payload: { actorId: '', organizationId },
  config: {},
});
```

O primeiro fator e o membership são validados antes do TOTP. Só depois o token
é criado.

### Responsabilidades do adapter MFA

- implementar TOTP;
- proteger `providerCredential` em repouso;
- devolver o contador validado;
- usar comparação atômica no repository;
- impedir duas configurações não desabilitadas por actor;
- evitar logs de secret, URI, credential e código;
- aplicar rate limiting no endpoint.

## Auditoria e secrets

O interceptor redige campos conhecidos, incluindo password, passwordHash,
secret, token, API key, authorization, credential, code e mfaCode. Mesmo assim:

- não confie em auditoria como cofre de secrets;
- não acrescente secrets em campos com nomes inesperados;
- não inclua credentials em URLs ou logs;
- use HTTPS e políticas de expiração curtas.
