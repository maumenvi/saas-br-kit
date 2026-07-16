A opção que melhor atende todos os requisitos é **RBAC por organização com permissões específicas por membro**. A autenticação permanece global, enquanto cargos e permissões ficam isolados dentro de cada organização.

```text
User 1 ─── 1 Credential
  |
  * Membership * ─── 1 Organization
        |
        * Role * ─── * Permission
        |
        * PermissionOverride

Organization.ownerUserId ───> User
```

## Opções

| Opção | Funcionamento | Vantagem | Limitação |
|---|---|---|---|
| RBAC puro | Cada membro possui um cargo, e o cargo possui permissões | Mais simples | Permissão específica exige criar um cargo exclusivo |
| RBAC + overrides | Cargo define permissões padrão; membro recebe permissões adicionais ou negações | Atende exatamente seu cenário | Exige regra clara para calcular permissão efetiva |
| ACL/grants | Cada autorização é um registro ligando usuário/cargo, ação e recurso | Máxima flexibilidade | Mais complexo para consultar, administrar e auditar |

Recomendo **RBAC + overrides**.

## Modelo recomendado

### User e autenticação global

`User` não pertence diretamente a uma organização:

```ts
type User = {
  id: string;
  email: Email;
  passwordHash: string;
  status: UserStatus;
};
```

Regras:

- `email` normalizado e único globalmente;
- senha nunca armazenada em texto puro;
- `RegisterUserUseCase` recebe a senha, usa um `PasswordHasherPort` e persiste somente `passwordHash`;
- login procura o usuário pelo e-mail e verifica a senha;
- a sessão/token representa apenas a identidade global do usuário;
- a organização usada em cada operação vem da rota, subdomínio, header ou contexto autenticado.

Se houver previsão de login social, MFA ou múltiplos métodos, outra opção é separar `Credential` de `User`. Para o cenário atual, `passwordHash` no agregado de usuário é suficiente.

### Membership

Representa a participação do usuário:

```ts
type OrganizationMembership = {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  status: MembershipStatus;
};
```

Deve existir uma restrição única para:

```text
organizationId + userId
```

Assim, o mesmo usuário utiliza o mesmo e-mail e senha, mas possui um vínculo diferente em cada organização.

Se futuramente um membro puder ter vários cargos simultaneamente, substitua `roleId` por uma associação `MembershipRole`.

### Cargo e permissões

```ts
type Role = {
  id: string;
  organizationId: string;
  name: string;
};

type RolePermission = {
  roleId: string;
  permission: PermissionKey;
};
```

Os nomes dos cargos são definidos pelo dono: `Gerente`, `Financeiro`, `Atendente`, por exemplo.

Já as capacidades precisam ser conhecidas pelo sistema:

```ts
const PERMISSIONS = [
  "organization.members.invite",
  "organization.members.remove",
  "organization.roles.manage",
  "organization.update",
  "organization.transfer-ownership",
] as const;
```

O dono escolhe quais dessas capacidades pertencem a cada cargo. Permitir que ele invente qualquer chave arbitrária não produz autorização real, porque os handlers precisam saber qual chave exigir.

### Permissões específicas do membro

```ts
type MemberPermissionOverride = {
  membershipId: string;
  permission: PermissionKey;
  effect: "allow" | "deny";
};
```

Cálculo recomendado:

```text
permissões do cargo
+ permissões allow do membro
- permissões deny do membro
```

`deny` deve prevalecer sobre `allow`.

## Dono da organização

Eu não modelaria o dono apenas como um cargo, porque o próprio dono poderia alterar o cargo e remover suas permissões.

Use uma referência explícita:

```ts
type Organization = {
  id: string;
  ownerUserId: string;
  // demais campos
};
```

Regras obrigatórias:

- `ownerUserId` não pode ser nulo;
- o dono deve possuir membership ativa;
- o dono sempre possui acesso administrativo, independentemente do cargo;
- não pode remover, desativar ou expulsar o membership do dono;
- transferência valida que o novo dono é um usuário válido;
- criação da membership, quando necessária, e alteração do dono acontecem na mesma transação;
- a troca deve atualizar diretamente o dono antigo para o novo, sem uma operação intermediária de “remover dono”;
- concorrência deve ser protegida com lock ou controle de versão.

O `PermissionInterceptor` autoriza quem pode solicitar a transferência. O `TransferOrganizationOwnershipUseCase` continua responsável pela invariável de nunca deixar a organização sem dono.

## Validação pelo `pipe`

Os handlers protegidos precisam receber contexto de autorização:

```ts
type AuthorizedInput<Data> = {
  auth: {
    userId: string;
    organizationId: string;
  };
  data: Data;
};
```

`userId` não deve vir livremente do body. Ele deve ser inserido pela camada web depois de validar o token ou sessão.

Usando o [pipe atual](/home/marco/Documentos/projetos/saas-br-kit/src/composition/pipe/pipe.ts), a cadeia ficaria conceitualmente:

```text
ErrorIntercept
  -> AuthenticationIntercept
    -> PermissionIntercept
      -> AuditIntercept
        -> UseCase
```

Como o primeiro interceptor do `pipe` é o mais externo:

```ts
pipe(
  handler,
  errorIntercept,
  authenticationIntercept,
  permissionIntercept,
  auditIntercept,
);
```

Cada composição informa a permissão exigida:

```text
organization.createRole       -> organization.roles.manage
organization.inviteMember     -> organization.members.invite
organization.transferOwner    -> organization.transfer-ownership
```

O `PermissionIntercept` deve:

1. localizar a membership por `userId + organizationId`;
2. verificar se está ativa;
3. liberar imediatamente se for o dono;
4. carregar permissões do cargo e overrides;
5. calcular a permissão efetiva;
6. lançar um erro de autorização se não estiver permitido;
7. chamar `next(input)` somente quando autorizado.

Para evitar várias consultas, eu criaria uma porta semântica como:

```ts
AuthorizationQueryPort.resolveAccess(userId, organizationId)
```

Ela retorna um snapshot com ownership, status da membership, permissões dos cargos e overrides. A policy do Core decide se o acesso é permitido; o adapter apenas consulta os dados.

Não colocaria permissões completas em JWTs de longa duração, porque mudanças feitas pelo dono demorariam a surtir efeito. O pipe deve consultar o estado atual ou um cache curto invalidado quando cargos e permissões mudarem.

Nenhum arquivo foi alterado. Considerei a reorganização atual para `src/core/entities/` que já está no worktree.