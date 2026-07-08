# Migração para o pacote único

## Snapshot importado

| Origem | Versão | Commit |
| --- | --- | --- |
| `@maumenvi/core` | 1.2.2 | `fecdb9d` |
| `@maumenvi/adapter-database-prisma` | 1.2.3 | `61e1008` |
| `@maumenvi/adapter-runtime-nest` | 1.3.1 | `b117128` |
| `@maumenvi/adapter-payment-asaas` | 1.2.1 | `f36969b` |

O snapshot do Core incluiu a alteração local já existente em
`src/core/ports/repositories/customer.ts`; os repositórios de origem não foram
alterados ou limpos durante a migração.

## Mapeamento de imports

| Antes | Agora |
| --- | --- |
| `@maumenvi/core/core` | `@maumenvi/saas-br-kit/core` |
| `@maumenvi/core/contracts` | `@maumenvi/saas-br-kit/contracts` |
| `@maumenvi/core/testing` | `@maumenvi/saas-br-kit/testing` |
| `@maumenvi/adapter-database-prisma` | `@maumenvi/saas-br-kit/adapters/database-prisma` |
| `@maumenvi/adapter-runtime-nest` | `@maumenvi/saas-br-kit/adapters/runtime-nest` |
| `@maumenvi/adapter-payment-asaas` | `@maumenvi/saas-br-kit/adapters/payment-asaas` |

Os pacotes anteriores devem permanecer disponíveis até que seus consumidores
sejam migrados e validados. A remoção ou arquivamento é uma decisão separada.
