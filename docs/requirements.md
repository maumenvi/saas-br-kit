# Requisitos

## Runtime

O projeto usa:

- TypeScript executado diretamente pelo Node.js em desenvolvimento e testes;
- ESM por meio de `"type": "module"`;
- imports locais com extensão `.ts`;
- sintaxe TypeScript apagável em runtime;
- `tsc --noEmit` para verificação de tipos;
- `dist/` com ESM JavaScript e declarations somente para distribuição;
- nenhuma pasta `build`.

Use Node.js 24 ou superior para a execução sem flag do TypeScript nativo. O
checkout atual é validado com Node.js 26. Em Node.js 22, o suporte nasceu como
experimental e pode exigir configuração diferente.

O Node remove os tipos do código do checkout, mas não faz typecheck. Execute:

```bash
npm run typecheck
```

Evite sintaxes TypeScript que exigem transformação de runtime, como `enum`,
parameter properties e namespace com valores. Prefira tuples `as const`, unions
e propriedades declaradas explicitamente.

## Instalação e imports

Instalação local a partir de uma aplicação vizinha:

```bash
npm install ../saas-br-kit
```

Import público:

```ts
import {
  Application,
  type DatabasePort,
} from '@maumenvi/saas-br-kit';

import {
  DatabaseMock,
} from '@maumenvi/saas-br-kit/mocks';
```

Arquivos internos em `src/` e `tests/` continuam importando diretamente o
arquivo proprietário. Consumidores não devem importar `src/` nem `dist/`.

## Estado do empacotamento

O pacote atual:

- chama-se `@maumenvi/saas-br-kit`;
- exige Node.js 24 ou superior;
- gera `dist/index.js` e `dist/index.d.ts`;
- reescreve imports relativos `.ts` para `.js` no runtime distribuído;
- exporta a raiz, `./mocks` e `./package.json`;
- publica no registry público do npm (`https://registry.npmjs.org`);
- usa acesso `public` com provenance;
- inclui somente `dist/`, `README.md` e `LICENSE` no tarball.

O Node não executa TypeScript de dependências dentro de `node_modules`. Por isso,
`dist/` é obrigatório para o pacote instalado, mesmo que o desenvolvimento
continue usando TS nativo.

Valide o artefato como um consumidor real:

```bash
npm run test:package
```

Esse comando gera o tarball, instala em uma pasta temporária, testa os imports de
runtime e executa typecheck usando as declarations publicadas.

## Dependências do consumidor

A lib não escolhe dependências concretas. Sua API deve fornecer:

- um adapter de transação/banco;
- repositories para todos os agregados do `Application`;
- logger;
- hash e verificação de senha;
- criação de token;
- provider e repository de MFA;
- provider e repository de verification;
- policies de status, slug, pagamento e cancelamento;
- opcionalmente email, mensagem telefônica, calendário e idempotência.

Você pode começar com os mocks, mas não deve usá-los como persistência de
produção.

## TypeScript

Um `tsconfig.json` de consumidor compatível com execução nativa pode partir de:

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "noEmit": true,
    "strict": true
  }
}
```

O projeto usa `moduleResolution: "bundler"` no typecheck do código-fonte e
`NodeNext` no build de distribuição. O consumidor
pode usar `NodeNext` quando quiser que o typecheck siga com mais fidelidade a
resolução do Node.

## O que não está incluído

A lib não fornece:

- controllers, DTOs, servidor HTTP ou framework;
- ORM, migrations ou schema de banco;
- adapter JWT, OAuth, API key ou TOTP concreto;
- templates e links de email/SMS/WhatsApp;
- fila, outbox, cron ou worker;
- rate limiting;
- cobrança automática ou gateway de pagamento;
- DNS, TLS, gateway ou roteamento por hostname;
- validação/renovação de sessão pronta;
- garantia de entrega da auditoria sem um adapter durável.
