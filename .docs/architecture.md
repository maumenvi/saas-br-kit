# Arquitetura

## Unidade de distribuição

O sistema é publicado como um único pacote npm, `@maumenvi/saas-br-kit`.
Subpaths mantêm as fronteiras de módulo sem exigir pacotes e versões separados.

## Direção das dependências

```text
runtime-nest ─┐
prisma ───────┼──> contratos genéricos ──> Core
asaas ────────┘
```

O Core não importa NestJS, Prisma, Asaas, OpenID Client ou qualquer outro
adapter concreto. Adapters concretos podem importar portas, contratos e tipos
do Core pelos aliases privados.

## Carregamento opcional

O entrypoint raiz e os subpaths de Core não reexportam adapters concretos.
Assim, uma aplicação standalone pode usar o pacote sem instalar NestJS ou
Prisma. Os peers opcionais são exigidos somente quando o subpath correspondente
é importado.

## Persistência

O schema canônico fica em `prisma/schema.prisma` e é publicado no subpath
`@maumenvi/saas-br-kit/adapters/database-prisma/schema.prisma`. O consumidor
continua responsável por incorporar o schema e controlar migrations.

## Testes

As suítes estão em `tests/core` e `tests/adapters`. Prisma e Asaas preservam
correspondência um-para-um entre arquivo source e arquivo de teste. O runtime
Nest mantém testes de fronteira sobre o build distribuível.
