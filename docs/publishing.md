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

## Release manual

O workflow `.github/workflows/release.yml` é iniciado pela interface do GitHub:

1. abra `Actions`;
2. selecione `Release package`;
3. clique em `Run workflow`;
4. informe uma versão SemVer sem `v`, como `1.1.0`;
5. confirme.

O workflow:

1. faz checkout da branch padrão;
2. valida versão e pacote;
3. atualiza `package.json` e `package-lock.json`;
4. cria commit `chore(release): vX.Y.Z`;
5. cria e envia a tag `vX.Y.Z`;
6. publica no npm com `NPM_TOKEN` e provenance;
7. cria um GitHub Release com notas geradas.

Permissões usadas:

```yaml
contents: write
id-token: write
```

`id-token: write` permite gerar a atestação de provenance do npm. O secret
`NPM_TOKEN` precisa ser um token de automação (ou granular com permissão de
publicação) da conta npm dona do escopo `@maumenvi`, cadastrado em
`Settings > Secrets and variables > Actions`.

O repositório precisa permitir que GitHub Actions envie o commit e a tag para a
branch padrão. Se houver branch protection, autorize o bot ou use uma regra que
permita esse workflow.

O workflow pode ser reexecutado com a mesma versão quando commit e tag já
existem no mesmo commit. Ele não republica uma versão encontrada no registry e
não recria um GitHub Release existente.
