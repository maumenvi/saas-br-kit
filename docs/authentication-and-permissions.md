# Autenticação, tenant e permissions

## Tenant por slug

O Core conhece o slug, não o hostname. A camada HTTP extrai o slug:

```text
Host: acme.exemplo.com.br
BASE_DOMAIN: exemplo.com.br
slug: acme
```

Depois:

```ts
const tenant = await application.tenant.resolve(slug);

if (!tenant) {
  return new Response('Tenant não encontrado', { status: 404 });
}
```

O `organizationId` da autenticação deve vir desse resultado, não do body,
query string ou header controlado pelo cliente.

```text
hostname -> tenant.resolve -> organizationId -> auth.authenticate
```

DNS wildcard, TLS, proxy e validação de forwarded headers pertencem à
infraestrutura consumidora.

## Autenticação

### LOGIN

Configuração:

```ts
authentication: {
  type: 'LOGIN',
  tokenPort,
}
```

Chamada:

```ts
const session = await application.auth.authenticate({
  authenticated: {
    email: 'ana@example.com',
    password: 'senha',
    organizationId: tenant.organizationId,
  },
  payload: {
    actorId: '',
    organizationId: tenant.organizationId,
    audience: 'web',
  },
  config: { expiresIn: '15m' },
});
```

O login:

1. busca `UserActor` pelo email;
2. verifica a senha com `PasswordHashPort`;
3. busca membership por actor + organização;
4. valida MFA ativa;
5. substitui a identidade do payload;
6. chama `TokenPort.createToken`;
7. retorna token e membership.

### CREDENTIALS

```ts
const application = new Application<
  TokenOutput,
  Statuses,
  Extras,
  'CREDENTIALS'
>({
  // demais dependências
  authentication: {
    type: 'CREDENTIALS',
    tokenPort,
    service: credentialsAuthPort,
  },
});

await application.auth.authenticate({
  authenticated: {
    identifier: 'client-id',
    secret: 'client-secret',
    organizationId,
  },
  payload: { actorId: '', organizationId },
  config: {},
});
```

### OAUTH

```ts
authentication: {
  type: 'OAUTH',
  tokenPort,
  service: oauthAuthPort,
}
```

Input:

```ts
{
  provider: 'google',
  accessToken: 'token-do-provedor',
  organizationId,
}
```

O adapter externo valida o token do provedor e retorna `AuthenticatedActor`.

### API_KEY

```ts
authentication: {
  type: 'API_KEY',
  tokenPort,
  service: apiKeyAuthPort,
}
```

Input:

```ts
{
  apiKey: 'credencial',
  organizationId,
}
```

Armazene somente representação segura da API key e compare no adapter.

### CUSTOM

```ts
type MagicLinkAuth = {
  code: string;
  organizationId: string;
};

const magicLinkPort: AuthPort<MagicLinkAuth> = {
  async authenticate(input) {
    const actor = await validateMagicLink(input.code);
    return actor
      ? { actorId: actor.id, actorType: 'USER' }
      : null;
  },
};

const application = new Application<
  TokenOutput,
  Statuses,
  Extras,
  'CUSTOM',
  MagicLinkAuth
>({
  // demais dependências
  authentication: {
    type: 'CUSTOM',
    tokenPort,
    service: magicLinkPort,
  },
});
```

O generic liga a estratégia ao input aceito e impede passar o objeto errado.

## MFA durante o login

Se existe MFA `ACTIVE` para um `USER`, a mesma chamada exige `mfaCode`:

```ts
await application.auth.authenticate({
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

MFA pendente ou desabilitada não bloqueia. `CLIENT` e `SERVICE` não passam pelo
TOTP implementado.

## Permissions

Uma permission é uma string tipada:

```ts
type PermissionKey =
  | 'actor:create'
  | 'actor:update'
  | 'actor:change-status'
  | 'actor:find'
  // ...demais módulos
```

Cada `MemberPermission` registra:

```ts
{
  id: string;
  membershipId: string;
  permission: PermissionKey;
  effect: 'allow' | 'deny';
  createdAt: Date;
  createdByActorId: string;
}
```

`role` é somente um nome. Um role `admin` sem permissions não autoriza nada.

### Criar decisões

```ts
import {
  PERMISSION_KEYS,
  type MemberPermission,
} from '@maumenvi/saas-br-kit';

const permissions: MemberPermission[] = PERMISSION_KEYS.map(
  (permission, index) => ({
    id: crypto.randomUUID(),
    membershipId,
    permission,
    effect: 'allow',
    createdAt: new Date(),
    createdByActorId: ownerActorId,
  }),
);
```

### Proteger operações

```ts
const protectedApplication =
  application.withPermission(session.membership);

await protectedApplication.customer.create(customer);
```

O interceptor:

- nega por padrão;
- considera apenas decisões do membership atual;
- exige pelo menos um `allow`;
- faz `deny` prevalecer sobre `allow`;
- lança `ACCESS_CONTROL_PERMISSION_DENIED`.

### Catálogo

Organization, membership, actor, service, customer, plan e subscription possuem:

```text
<recurso>:create
<recurso>:update
<recurso>:change-status
<recurso>:find
```

Appointment também possui:

```text
appointment:cancel
```

## Isolamento por organização

Permission e tenant são controles diferentes:

- permission responde “este membership pode fazer esta ação?”;
- escopo responde “a entidade pertence à organização deste membership?”.

As facades de service, customer, plan, subscription e appointment verificam os
dois. Use sempre `organizationId` vindo da sessão.

```ts
const customer = await app.customer.findById({
  organizationId: session.membership.organizationId,
  id: request.params.id,
});
```

O repository também deve filtrar pelo tenant. Essa defesa em profundidade evita
que um bug no controller vaze dados.

## Reidratação de sessão

`Application` não verifica tokens. Uma API normalmente:

1. verifica assinatura e validade no adapter;
2. lê `actorId` e `organizationId`;
3. busca o membership atual no banco;
4. verifica se ele continua habilitado;
5. chama `withPermission(membership)`.

Não desserialize um membership inteiro enviado pelo cliente e trate como
confiável.
