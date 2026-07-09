# ADR-001: Core e adapters em um pacote

- Status: aceito
- Data: 2026-07-08

## Contexto

O modelo com um repositório e pacote por componente aumentou o custo de
versionamento, instalação e validação cruzada.

## Decisão

Core, contratos genéricos e adapters oficiais Prisma, NestJS e Asaas passam a
ser mantidos e distribuídos em `@maumenvi/saas-br-kit`.

As fronteiras continuam explícitas por diretórios e subpath exports. O Core
permanece dependency-free e não reexporta adapters concretos.

Dependências de framework e ORM são peers opcionais. `openid-client`, usado
diretamente pelo runtime oficial, é dependência runtime do pacote.

## Consequências

- uma versão coordena Core e adapters;
- existe uma única instalação, CI e publicação;
- consumidores precisam atualizar imports;
- o pacote e o lockfile ficam maiores;
- alterações em qualquer adapter podem provocar uma nova versão do pacote;
- testes devem impedir dependências concretas dentro do Core.

Esta decisão substitui, neste repositório, o modelo de distribuição em
repositórios e pacotes separados.
