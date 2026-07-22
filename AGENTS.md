# AGENTS.md

## Escopo

Estas instruções valem para todo o repositório `saas-br-kit`.


## MCPs
  - Use context7 
  - Use sempre TS nativo do Node. não gere pasta build.

## Objetivo do projeto

O projeto fornece um Core TypeScript reutilizável para aplicações SaaS brasileiras. O código de domínio e os casos de uso não devem depender de framework web, ORM ou provedor externo. A infraestrutura entra por portas e é conectada na camada `composition`.

Antes de alterar a arquitetura, leia `.specs/README.md` e os documentos ligados por ela.

## Fonte de verdade

Use esta ordem ao decidir como o projeto funciona:

1. Código e testes atuais.
2. Especificações em `.specs/`.
3. Outros documentos versionados no repositório, quando existirem.

Não transforme diagramas, propostas ou planos futuros em módulos implementados sem que a tarefa peça essa expansão.

## Limites arquiteturais

- `src/core/` contém domínio, casos de uso, contratos, contextos e portas. Não importe framework, ORM ou implementação concreta nessa camada.
- `src/composition/` monta contextos e casos de uso. Dependências concretas devem chegar por input do composition root.
- `src/mocks/` existe para testes e exemplos locais. Código de produção não deve depender desses mocks.
- Todo código interno em `src/` e `tests/` deve importar diretamente o arquivo proprietário do símbolo por caminho relativo. Não use nenhum `index.ts` como atalho interno.
- Arquivos `index.ts` existem somente para reexportar a API pública. Apenas os próprios `index.ts` e seus testes `index.test.ts` podem importar uma superfície via `index.ts`.
- Imports e exports locais devem incluir a extensão `.ts`, pois o projeto executa TypeScript diretamente como ESM.
- Mantenha somente barrels rasos: um `index.ts` por pasta pública de primeiro nível. Não recrie uma cadeia de barrels em todas as subpastas.

## Padrão de módulo

Um módulo de negócio deve manter responsabilidades separadas:

- `domain/`: value objects e erros de domínio;
- `application/*.input.ts`: formato tipado da entidade recebido pelos casos de uso;
- `application/use-cases/`: intenção da aplicação;
- `<module>.repositories.ts`: porta de persistência específica do agregado;
- `index.ts`: exports públicos do módulo.

Use cases de escrita devem:

1. validar value objects antes de abrir a operação de banco;
2. executar persistência por `ExecutionContext.databaseProvider.run(...)`;
3. propagar erros para que o provider registre rollback;
4. depender da porta específica do agregado, nunca de um adapter concreto.

O `RepositoryPort<Entity>` mantém somente operações comuns. Consultas semânticas, como `findByEmail` e `findByCnpj`, pertencem ao repository do agregado.

## Tipagem de status

- O Core não define os valores de status do consumidor.
- `Actor<Status>` e `Organization<Status>` recebem o status por generic.
- `RepositoriesStatus` associa cada repository ao respectivo tipo de status.
- Não una status de agregados diferentes em um único tipo sem que isso seja uma regra explícita do domínio.
- Um `type` TypeScript não existe em runtime. Quando forem necessários valores em runtime, declare um tuple `as const` e derive o tipo dele.

## Exports e compatibilidade

- Ao adicionar um contrato público, atualize o `index.ts` do módulo e confira a propagação até `src/core/index.ts` ou `src/composition/index.ts`.
- Evite renomear exports públicos sem alias de compatibilidade ou uma decisão explícita de breaking change.
- Preserve o nome público atual `Aplication` enquanto não houver uma migração deliberada para `Application`.

## Testes

- A árvore de `tests/` deve espelhar a árvore de `src/`.
- Para código com comportamento, crie testes reais no mesmo caminho relativo.
- Para arquivos somente de tipos ou barrels, use um teste placeholder apenas quando não existir comportamento observável.
- Cubra sucesso, validação anterior à transação, retorno vazio e rollback quando essas situações se aplicarem.
- Não ajuste testes não relacionados apenas para ocultar uma falha. Informe separadamente problemas preexistentes.

## Validação

Execute, nesta ordem, quando o escopo permitir:

```bash
npm run test:layout
npm run test:imports
npm test
npm exec --yes --package typescript -- tsc --noEmit
git diff --check
```

Se uma validação global falhar por alterações preexistentes ou fora do escopo, valide isoladamente os arquivos alterados e registre com precisão os erros restantes.

## Manutenção das especificações

- Mudanças de arquitetura, contratos públicos, módulos, comandos ou critérios de qualidade devem atualizar `.specs/` na mesma entrega.
- Descreva separadamente o que está implementado, o que é limitação atual e o que é evolução planejada.
- Não apresente uma intenção futura como funcionalidade disponível.

## Proteção do trabalho local

- O worktree pode conter alterações do usuário. Não reverta, reformate em massa ou sobrescreva arquivos fora do escopo.
- Antes de editar, confira `git status --short` e o diff dos arquivos que serão tocados.
- Não use comandos destrutivos de Git sem pedido explícito.
