# Erros, testes e produção

## Erros

Erros de domínio usam:

```ts
class DomainError extends Error {
  readonly code: string;
  readonly target: string;
  readonly details: Record<string, unknown>;
}
```

Use `code` como contrato estável da sua API. `message` ajuda no diagnóstico, mas
não deve ser a única forma de identificar o erro.

```ts
import { DomainError } from '@maumenvi/saas-br-kit';

try {
  await application.tenant.resolve(slug);
} catch (error) {
  if (error instanceof DomainError) {
    return Response.json(
      {
        code: error.code,
        target: error.target,
        details: error.details,
      },
      { status: domainErrorStatus(error.code) },
    );
  }
  throw error;
}
```

A biblioteca não fixa status HTTP. Um mesmo erro pode ser mapeado de forma
diferente por APIs distintas.

### Famílias

Os barrels públicos dos módulos exportam os seguintes códigos e fábricas:

```ts
ACTOR_ERROR_CODE
ORGANIZATION_ERROR_CODE
MEMBERSHIP_ERROR_CODE
MFA_ERROR_CODE
VERIFICATION_ERROR_CODE
SERVICE_ERROR_CODE
CUSTOMER_ERROR_CODE
PLAN_ERROR_CODE
SUBSCRIPTION_ERROR_CODE
APPOINTMENT_ERROR_CODE
DOCUMENT_ERROR_CODE
ACCESS_CONTROL_ERROR_CODE
IDEMPOTENCY_ERROR_CODE
```

`AUTH_ERROR_CODE` e `AuthErrors` também são exportados pela superfície principal.

Exemplos comuns:

- `AUTH_FAILED`: credencial inválida;
- `AUTH_UNAUTHORIZED`: actor sem membership no tenant;
- `MFA_CODE_REQUIRED`: segundo fator obrigatório;
- `ACCESS_CONTROL_PERMISSION_DENIED`: permission ausente ou negada;
- `IDEMPOTENCY_IN_PROGRESS`: mesma execução ainda reservada.

Não devolva stack trace ao cliente.

## Auditoria

Todos os handlers montados pelas compositions padrão são auditados. O registro
contém:

- ação;
- `SUCCESS` ou `ERROR`;
- actor, organização e membership quando conhecidos;
- snapshots de input e output;
- erro estruturado;
- início, fim e duração.

Auditoria não bloqueia o handler. O adapter deve capturar falhas e, quando
durabilidade for requisito, publicar em fila persistente.

Campos sensíveis conhecidos são redigidos. Ainda assim, projete inputs para não
carregar secrets desnecessários.

## Testes do consumidor

### Teste de repository

Crie uma suíte de contrato para cada adapter:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

test('findById retorna null para id ausente', async () => {
  const repository = await createRepositoryForTest();
  assert.equal(await repository.findById('missing'), null);
});

test('rollback remove gravações da operação', async () => {
  const database = await createDatabaseForTest();

  await assert.rejects(
    database.run(async () => {
      await repository.save(entity);
      throw new Error('force rollback');
    }),
  );

  assert.equal(await repository.findById(entity.id), null);
});
```

Teste também:

- constraints únicas;
- isolamento por `organizationId`;
- updates condicionais de MFA;
- transições condicionais de verification;
- concorrência na aquisição de idempotência;
- serialização e desserialização de `Date`;
- mapeamento de value objects.

### Relógio e ids determinísticos

```ts
const fixedDate = new Date('2026-08-01T12:00:00.000Z');

executionContextInput: {
  // outros providers
  clock: () => fixedDate,
  idGenerator: () => 'fixed-id',
}
```

Isso evita testes dependentes do relógio e de UUID aleatório.

### Mocks

`src/mocks/` oferece repositories e providers em memória. Eles ajudam em testes
de composição e exemplos, mas não testam transação real, concorrência,
constraints, índices ou integração externa.

## Testes da lib

```bash
npm run test:layout
npm run test:imports
npm test
npm exec --yes --package typescript -- tsc --noEmit
git diff --check
```

`tests/` espelha `src/`. Imports internos via barrel são proibidos.

## Checklist de produção

### Banco

- todas as escritas do callback usam a mesma transação;
- email, CNPJ e slug têm representação canônica e constraints;
- actor + organização têm unicidade de membership quando aplicável;
- MFA possui update de contador atômico;
- verification possui transições condicionais atômicas;
- consultas multi-tenant têm índice e filtro por `organizationId`;
- datas são armazenadas com timezone bem definido.

### Segurança

- senhas usam Argon2id, bcrypt ou equivalente apropriado;
- token possui chave, issuer, audience, TTL e rotação definidos;
- refresh/session é implementado no consumidor;
- credentials, códigos e secrets não aparecem em logs;
- endpoints públicos usam rate limiting;
- MFA possui proteção contra brute force;
- membership é reidratado ou validado no servidor;
- forwarded host só é aceito de proxy confiável.

### Mensagens

- template não injeta dados sem escape;
- links não colocam credentials em logs;
- envio tem retry e dead-letter quando necessário;
- comando de envio é separado da persistência;
- falha de provider é observável.

### Auditoria

- storage é append-only;
- acesso à trilha é restrito;
- retenção está definida;
- entrega durável usa fila quando necessária;
- dados pessoais seguem política de privacidade.

### Idempotência

- leases têm TTL;
- `complete` e `release` validam `leaseId`;
- outputs são serializáveis;
- storage tem limite e retenção;
- resposta HTTP é reconstruída pelo adapter;
- secrets não são persistidos no replay.

### Appointments

- timezone da organização é tratado na borda;
- o Core recebe `Date` representando instantes corretos;
- calendário externo usa `appointmentId` como chave;
- retry do calendário não duplica evento;
- cancelamento usa o workflow que estorna consumo.

## Limitações atuais a considerar

- validação e renovação de tokens não têm facade pronta;
- cobrança automática não está implementada;
- convite exige actor existente;
- não há adapter concreto de banco, token, TOTP ou mensagens;
- audit fire-and-forget é best-effort sem fila;
- HTTP, DTOs, rate limiting, cron e workers pertencem ao consumidor.
