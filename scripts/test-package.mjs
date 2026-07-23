import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(import.meta.dirname, '..');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'saas-br-kit-package-'));
const consumerRoot = join(temporaryRoot, 'consumer');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;

function run(command, args, cwd, extraEnvironment = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: join(temporaryRoot, 'npm-cache'),
      ...extraEnvironment,
    },
  });

  if (result.status !== 0) {
    throw new Error([
      `Falha ao executar: ${command} ${args.join(' ')}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }

  return result.stdout;
}

try {
  await mkdir(consumerRoot);
  await writeFile(
    join(consumerRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2),
  );
  run(npmCommand, ['install', projectRoot], consumerRoot);
  await writeFile(
    join(consumerRoot, 'local-smoke.mjs'),
    `
      import { Application } from '@maumenvi/saas-br-kit';
      import { DatabaseMock } from '@maumenvi/saas-br-kit/mocks';
      if (typeof Application !== 'function') throw new Error('Application ausente');
      if (typeof DatabaseMock !== 'function') throw new Error('DatabaseMock ausente');
    `,
  );
  run(nodeCommand, ['local-smoke.mjs'], consumerRoot);

  await writeFile(
    join(temporaryRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2),
  );

  run(
    npmCommand,
    ['pack', projectRoot, '--pack-destination', temporaryRoot],
    temporaryRoot,
  );

  const tarballs = (await readdir(temporaryRoot))
    .filter((filename) => filename.endsWith('.tgz'));
  assert.equal(tarballs.length, 1, 'npm pack deve gerar exatamente um tarball');

  await writeFile(
    join(temporaryRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2),
  );
  run(
    npmCommand,
    ['install', join(temporaryRoot, tarballs[0]), '--ignore-scripts'],
    temporaryRoot,
  );

  const runtimeExample = `
    import {
      Application,
      AUTH_ERROR_CODE,
      PERMISSION_KEYS,
    } from '@maumenvi/saas-br-kit';
    import {
      DatabaseMock,
      LoggerMock,
    } from '@maumenvi/saas-br-kit/mocks';

    if (typeof Application !== 'function') throw new Error('Application ausente');
    if (typeof AUTH_ERROR_CODE.AUTH_FAILED !== 'string') {
      throw new Error('AUTH_ERROR_CODE ausente');
    }
    if (PERMISSION_KEYS.length !== 33) throw new Error('Catálogo incompleto');
    if (typeof DatabaseMock !== 'function') throw new Error('DatabaseMock ausente');
    if (typeof LoggerMock !== 'function') throw new Error('LoggerMock ausente');
  `;
  await writeFile(join(temporaryRoot, 'smoke.mjs'), runtimeExample);
  run(nodeCommand, ['smoke.mjs'], temporaryRoot);

  const typeExample = `
    import {
      Application,
      type ActorStatusPolicyPort,
      type OrganizationStatusPolicyPort,
      type TokenPort,
    } from '@maumenvi/saas-br-kit';
    import { DatabaseMock } from '@maumenvi/saas-br-kit/mocks';

    const token: TokenPort<string> | undefined = undefined;
    const actorPolicy: ActorStatusPolicyPort<'active'> | undefined = undefined;
    const organizationPolicy:
      OrganizationStatusPolicyPort<'active'> | undefined = undefined;

    void Application;
    void DatabaseMock;
    void token;
    void actorPolicy;
    void organizationPolicy;
  `;
  await writeFile(join(temporaryRoot, 'smoke.ts'), typeExample);
  await writeFile(
    join(temporaryRoot, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: 'ES2025',
      },
      include: ['smoke.ts'],
    }, null, 2),
  );

  const localBin = join(projectRoot, 'node_modules', '.bin');
  run(
    process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
    ['--project', 'tsconfig.json'],
    temporaryRoot,
    { PATH: `${localBin}${delimiter}${process.env.PATH ?? ''}` },
  );

  const installedManifest = JSON.parse(
    await readFile(
      join(
        temporaryRoot,
        'node_modules',
        '@maumenvi',
        'saas-br-kit',
        'package.json',
      ),
      'utf8',
    ),
  );
  assert.equal(installedManifest.name, '@maumenvi/saas-br-kit');
  assert.equal(installedManifest.main, './dist/index.js');

  console.log(
    'Instalação local e tarball importados e tipados com sucesso.',
  );
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
