# AGENTS.md

Este repositório contém um único pacote: `@maumenvi/saas-br-kit`.

## Fontes de verdade

1. `.specs/README.md`;
2. `.docs/architecture.md`;
3. `.docs/adr/`;
4. `README.md`.

Não invente requisitos ou amplie escopo sem decisão registrada.

## Arquitetura obrigatória

- O Core fica em `src/core` e não importa frameworks, ORMs ou SDKs externos.
- Contratos dependency-free ficam em `src/contracts`.
- Contratos genéricos de adapters ficam em `src/adapters/{cache,database,payment,runtime}`.
- Implementações oficiais ficam em `src/adapters/{database-prisma,runtime-nest,payment-asaas}`.
- Testes seguem os mesmos grupos em `tests/`.
- Integrações concretas podem depender do Core; o Core nunca depende delas.
- Imports internos entre adapters e Core usam os aliases privados definidos no
  `package.json` e no `tsconfig.json`.
- Imports de consumidores usam somente os subpaths públicos documentados.
- Não crie arquivos genéricos grandes; divida por responsabilidade.

## Fluxo de trabalho

- Use Gitflow. Features partem de `develop` e retornam por PR para `develop`.
- Antes de alterar código, execute `npm run gitnexus:update`.
- Preserve alterações não relacionadas.
- Antes do PR, execute `npm run ci`.
- O agente pode abrir e revisar PR, mas apenas o usuário pode aprová-lo.

## Qualidade

- Core class-based e sem dependências runtime externas.
- Erros esperados retornam `Result`.
- `AppContext` e `ExecutionContext` permanecem separados.
- Logs e erros não expõem segredos ou payloads sensíveis.
- Mudanças em API pública exigem teste de empacotamento e atualização documental.
