import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function filesUnder(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function normalize(path) {
  return path.split(sep).join('/');
}

const sources = filesUnder('src')
  .filter((path) => path.endsWith('.ts'))
  .map((path) => normalize(relative('src', path)))
  .sort();

const tests = filesUnder('tests')
  .filter((path) => path.endsWith('.test.ts'))
  .map((path) => normalize(relative('tests', path)))
  .sort();

const expectedTests = new Set(
  sources.map((path) => path.replace(/\.ts$/, '.test.ts')),
);
const expectedSources = new Set(
  tests.map((path) => path.replace(/\.test\.ts$/, '.ts')),
);

const missing = [...expectedTests].filter((path) => !tests.includes(path));
const extra = [...expectedSources].filter((path) => !sources.includes(path));

if (missing.length || extra.length) {
  if (missing.length) {
    console.error('Testes ausentes:');
    missing.forEach((path) => console.error(`- tests/${path}`));
  }

  if (extra.length) {
    console.error('Testes sem arquivo correspondente em src:');
    extra.forEach((path) => console.error(`- tests/${path.replace(/\.ts$/, '.test.ts')}`));
  }

  process.exitCode = 1;
} else {
  console.log(`Layout válido: ${sources.length} arquivos de src e ${tests.length} testes.`);
}
