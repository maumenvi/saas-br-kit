# Contribuindo com o saas-br-kit

Obrigado pelo interesse em contribuir. Issues e pull requests são bem-vindos.

## Antes de começar

- Para bugs, abra uma issue com versão do pacote, versão do Node.js, um trecho
  mínimo que reproduza o problema e o comportamento esperado.
- Para mudanças de API pública ou de arquitetura, abra uma issue para discutir a
  proposta antes de implementar.

## Ambiente

Requer Node.js 24 ou superior. O desenvolvimento e os testes executam TypeScript
diretamente pelo Node, sem etapa de build.

```bash
git clone https://github.com/maumenvi/saas-br-kit.git
cd saas-br-kit
npm install
npm test
```

## Regras do projeto

- `src/core/` contém domínio, casos de uso e portas; não importe framework, ORM
  ou implementação concreta nessa camada.
- `src/composition/` monta contextos e casos de uso; dependências concretas
  chegam por input.
- Imports internos apontam diretamente para o arquivo dono do símbolo, com
  extensão `.ts`. Arquivos `index.ts` existem somente para a API pública.
- A árvore de `tests/` espelha a de `src/`. Todo código com comportamento
  precisa de teste no mesmo caminho relativo.
- Mudanças em contratos públicos ou arquitetura devem atualizar `docs/` no mesmo
  pull request.

Detalhes completos em [AGENTS.md](./AGENTS.md) e na
[documentação](./docs/README.md).

## Validação

Antes de abrir o pull request, execute:

```bash
npm run ci
git diff --check
```

A CI executa as mesmas validações em Node.js 24 e 26.

## Pull requests

- Mantenha o escopo pequeno e focado.
- Descreva o problema, a solução e como foi testado.
- Use mensagens de commit no formato [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

Ao contribuir, você concorda que sua contribuição será licenciada sob a
[licença MIT](./LICENSE) do projeto.
