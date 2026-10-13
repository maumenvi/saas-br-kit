# Publicação e instalação

O pacote é open source (MIT), ESM-only e publicado no registry público do npm
como:

```text
@maumenvi/saas-br-kit
```

```bash
npm install @maumenvi/saas-br-kit
```

## Pontos de entrada

```ts
import {
  Application,
  type DatabasePort,
} from '@maumenvi/saas-br-kit';

import {
  DatabaseMock,
} from '@maumenvi/saas-br-kit/mocks';
```

O `package.json` exporta:

| Import | Destino distribuído | Uso |
| --- | --- | --- |
| `@maumenvi/saas-br-kit` | `dist/index.js` | Core e composition |
| `@maumenvi/saas-br-kit/mocks` | `dist/mocks/index.js` | testes e exemplos |
| `@maumenvi/saas-br-kit/package.json` | `package.json` | metadados |

Imports de `src/`, `dist/` ou outros subpaths não fazem parte da API pública.

## Instalação local

Estrutura:

```text
projetos/
  saas-br-kit/
  minha-api/
```

Em `minha-api`:

```bash
npm install ../saas-br-kit
```

O npm executa `prepare`, que gera `dist/`. A dependência fica registrada como
um caminho `file:` no `package.json` do consumidor.

Para atualizar depois de mudanças na lib:

```bash
cd ../saas-br-kit
npm run build
cd ../minha-api
npm install
```

O import local é igual ao import da versão publicada; não use caminhos relativos
para `src/`.

## Instalação pelo npm

Nenhum token ou `.npmrc` é necessário:

```bash
npm install @maumenvi/saas-br-kit
npm install @maumenvi/saas-br-kit@1.0.0
```

## Build de distribuição

Desenvolvimento e testes continuam executando `.ts` diretamente:

```bash
npm test
```

O pacote instalado precisa de JavaScript porque o Node não remove tipos de
arquivos dentro de `node_modules`. O build autorizado gera apenas o artefato
ignorado `dist/`:

```bash
npm run build
```

Saídas:

```text
dist/
  index.js
  index.d.ts
  core/
  composition/
  mocks/
```

O tarball inclui somente:

```text
dist/
README.md
LICENSE
package.json
```

## Validação antes de publicar

```bash
npm run ci
git diff --check
```

`npm run test:package`:

1. executa `npm pack`;
2. instala o tarball em uma pasta temporária;
3. importa a raiz e `./mocks` em runtime;
4. executa typecheck contra as declarations;
5. confirma nome e entrypoint do manifest instalado;
6. remove a pasta temporária.

Para inspecionar apenas o conteúdo:

```bash
npm run pack:dry-run
```

## CI automático

`.github/workflows/ci.yml` executa em:

- pushes para `main` e `develop`;
- pull requests;
- disparo manual.

A matriz usa Node.js 24 e 26 e valida código-fonte, testes, typecheck, build e
tarball consumidor.

## Publicação

A publicação é feita somente a partir da máquina do mantenedor; não há workflow
de release. Com a conta npm dona do escopo `@maumenvi`:

```bash
npm whoami                 # confirme a conta; use npm login se necessário
git switch main && git pull
npm run ci                 # valida código, build e tarball
npm version 1.1.0          # atualiza package.json/lock, cria commit e tag v1.1.0
npm publish                # gera dist/ via prepack e publica com acesso público
git push --follow-tags     # envia o commit e a tag
```

Use `npm version patch`, `minor` ou `major` para incrementar automaticamente.
Se a conta tiver 2FA, o npm pedirá o código no `npm publish`.

Opcionalmente, crie um GitHub Release para a tag:

```bash
gh release create v1.1.0 --verify-tag --generate-notes
```

Não use `--provenance` localmente: a atestação só pode ser gerada em um
provedor de CI suportado, como o GitHub Actions. O npm não permite republicar
uma versão já existente; para corrigir uma versão publicada, publique uma nova.
