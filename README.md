# @maumenvi/saas-br-kit

Pacote único do SaaS BR Kit. A mesma distribuição contém o Core e os adapters
oficiais de Prisma, NestJS e Asaas, mantendo cada integração em um subpath
explícito.

## Estrutura

```text
src/
  core/
  contracts/
  testing/
  adapters/
    cache/
    database/
    payment/
    runtime/
    database-prisma/
    runtime-nest/
    payment-asaas/
tests/
  core/
  adapters/
    database-prisma/
    runtime-nest/
    payment-asaas/
```

Os quatro primeiros diretórios em `src/adapters` contêm contratos genéricos.
Os três diretórios com nome de tecnologia contêm as implementações oficiais.

## Instalação

```bash
npm install @maumenvi/saas-br-kit
```

Instale somente os peers do adapter usado:

```bash
# Prisma 7/PostgreSQL
npm install @prisma/client @prisma/adapter-pg
npm install --save-dev prisma

# NestJS 11
npm install @nestjs/common @nestjs/core @nestjs/swagger reflect-metadata rxjs
```

O adapter Asaas usa o cliente HTTP incluído no pacote e não exige SDK externo.

## Imports públicos

```ts
import { SaasBrCore, clock, idGenerator, logger, transactionManager } from "@maumenvi/saas-br-kit/core";
import {
  createFixedClock,
  createNoopLogger,
  createPassthroughTransactionManager,
  createSequentialIdGenerator,
} from "@maumenvi/saas-br-kit/testing";
import { prismaCoreAdapter } from "@maumenvi/saas-br-kit/adapters/database-prisma";
import { nestCoreAdapter } from "@maumenvi/saas-br-kit/adapters/runtime-nest";
import {
  asaasCoreAdapter,
  createAsaasApiClient,
} from "@maumenvi/saas-br-kit/adapters/payment-asaas";
```

Composição mínima sem obrigar adapter:

```ts
const application = await SaasBrCore.create()
  .add(clock(createFixedClock(new Date("2026-06-18T00:00:00.000Z"))))
  .add(logger(createNoopLogger()))
  .add(idGenerator(createSequentialIdGenerator("app")))
  .add(transactionManager(createPassthroughTransactionManager()))
  .build();
```

Adapters concretos entram pelo namespace de adapters:

```ts
const application = await SaasBrCore.create()
  .add(clock(createFixedClock(new Date("2026-06-18T00:00:00.000Z"))))
  .add(logger(createNoopLogger()))
  .add(idGenerator(createSequentialIdGenerator("app")))
  .add(transactionManager(createPassthroughTransactionManager()))
  .adapters.add(prismaCoreAdapter({ client }))
  .build();
```

Também são públicos:

- `@maumenvi/saas-br-kit/contracts`;
- `@maumenvi/saas-br-kit/testing`;
- `@maumenvi/saas-br-kit/adapters/cache`;
- `@maumenvi/saas-br-kit/adapters/database`;
- `@maumenvi/saas-br-kit/adapters/payment`;
- `@maumenvi/saas-br-kit/adapters/runtime`;
- `@maumenvi/saas-br-kit/adapters/database-prisma/testing`;
- `@maumenvi/saas-br-kit/adapters/database-prisma/schema.prisma`;
- `@maumenvi/saas-br-kit/adapters/runtime-nest/testing`;
- `@maumenvi/saas-br-kit/adapters/payment-asaas/testing`.

O entrypoint raiz exporta apenas Core, contratos e adapters genéricos. Isso evita
carregar NestJS ou outro peer quando a aplicação usa somente o Core.

## Desenvolvimento

Requisitos: Node.js `>=22.18.0`, npm e TypeScript 6.

```bash
npm install
npm run gitnexus:update
npm run ci
```

Comandos principais:

- `npm run check`: formatação e lint;
- `npm run typecheck`: valida source e testes;
- `npm test`: build e todas as suítes;
- `npm run test:package`: instala o tarball em um consumidor temporário;
- `npm run prisma:generate`: gera o client de referência;
- `npm run pack:dry-run`: valida o conteúdo publicável.

## Documentação

- [Arquitetura](.docs/architecture.md)
- [Migração dos pacotes anteriores](.docs/migration.md)
- [ADR do pacote unificado](.docs/adr/ADR-001-pacote-unificado.md)
- [Especificação](.specs/README.md)

Licença comercial/proprietária. Consulte [LICENSE](LICENSE).
