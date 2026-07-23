# Publicação e instalação

O pacote é privado, ESM-only e publicado como:

```text
@maumenvi/saas-br-kit
```

Registry:

```text
https://npm.pkg.github.com
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

Imports de `src/`, `dist/` ou outros subpaths são privados.

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

## Instalação pelo GitHub Packages

Copie `.npmrc.example` para `.npmrc` na aplicação consumidora ou adicione:

```ini
@maumenvi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

Exporte um personal access token classic com `read:packages`. Repositórios
privados também podem exigir `repo`, conforme o acesso configurado no GitHub:

```bash
export GITHUB_TOKEN=github_pat_replace_me
npm install @maumenvi/saas-br-kit@1.0.0
```

Nunca faça commit do token. `.env` e `.npmrc` com segredo real devem permanecer
fora do Git.

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
6. publica no GitHub Packages com `GITHUB_TOKEN`;
7. cria um GitHub Release com notas geradas.

Permissões usadas:

```yaml
contents: write
packages: write
```

O repositório precisa permitir que GitHub Actions envie o commit e a tag para a
branch padrão. Se houver branch protection, autorize o bot ou use uma regra que
permita esse workflow.

O workflow pode ser reexecutado com a mesma versão quando commit e tag já
existem no mesmo commit. Ele não republica uma versão encontrada no registry e
não recria um GitHub Release existente.

## Visibilidade privada

`publishConfig.access` usa `restricted`, mas a política efetiva também depende
das configurações do pacote no GitHub:

1. abra a página do package;
2. entre em `Package settings`;
3. mantenha visibilidade privada/restricted;
4. conceda acesso somente aos repositórios consumidores;
5. habilite herança de acesso do repositório quando essa for a política desejada.

O workflow prepara a publicação; ele não altera automaticamente a visibilidade
do repositório Git.

