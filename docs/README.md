# Documentação do saas-br-kit

Esta documentação descreve o comportamento implementado no código atual. Os
exemplos usam TypeScript nativo do Node.js e não dependem de framework web.

## Trilha recomendada para quem está começando

1. [Requisitos](./requirements.md): runtime, TypeScript, instalação e limitações.
2. [Primeiro uso](./getting-started.md): montar `Application` e executar um fluxo.
3. [Arquitetura](./architecture.md): Core, composition, handlers, interceptors e adapters.
4. [Ports](./ports.md): todos os contratos que o consumidor implementa.
5. [Casos de uso](./use-cases.md): catálogo completo das operações expostas.
6. [Autenticação, tenant e permissions](./authentication-and-permissions.md).
7. [Registro, verification e MFA](./registration-verification-mfa.md).
8. [Catálogo, subscriptions e appointments](./catalog-and-appointments.md).
9. [Erros, testes e produção](./errors-testing-and-production.md).
10. [Publicação e instalação](./publishing.md).

## Procure pelo que você quer fazer

| Quero... | Leia |
| --- | --- |
| Entender o que a lib faz | [Arquitetura](./architecture.md) |
| Montar a aplicação | [Primeiro uso](./getting-started.md) |
| Ligar Prisma, SQL ou outro banco | [Database e repositories](./ports.md#persistência) |
| Usar JWT ou outro token | [TokenPort](./ports.md#tokenportoutput) |
| Fazer login | [Autenticação](./authentication-and-permissions.md#autenticação) |
| Resolver organização por subdomínio | [Tenant](./authentication-and-permissions.md#tenant-por-slug) |
| Autorizar uma rota | [Permissions](./authentication-and-permissions.md#permissions) |
| Cadastrar a primeira organização | [Registro público](./registration-verification-mfa.md#registro-público) |
| Confirmar email ou telefone | [Verification](./registration-verification-mfa.md#verification) |
| Ativar TOTP | [MFA](./registration-verification-mfa.md#mfa-totp) |
| Criar serviço, plano e assinatura | [Catálogo](./catalog-and-appointments.md) |
| Agendar e cancelar | [Appointments](./catalog-and-appointments.md#appointments) |
| Enviar email, SMS ou WhatsApp | [Ports de mensagem](./ports.md#mensagens) |
| Integrar calendário | [CalendarIntegrationPort](./ports.md#calendarintegrationport) |
| Implementar idempotência | [IdempotencyPort](./ports.md#idempotencyport) |
| Tratar erros HTTP | [Erros](./errors-testing-and-production.md#erros) |
| Testar adapters | [Testes](./errors-testing-and-production.md#testes-do-consumidor) |
| Instalar localmente | [Instalação local](./publishing.md#instalação-local) |
| Instalar do npm | [Instalação pelo npm](./publishing.md#instalação-pelo-npm) |
| Publicar uma versão | [Publicação](./publishing.md#publicação) |

## Fonte de verdade

Em caso de divergência, use esta ordem:

1. código e testes atuais;
2. documentos em `docs/`.

Documentação deve ser atualizada quando uma mudança altera arquitetura,
contratos públicos, módulos ou critérios de qualidade.
