import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

function filesUnder(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function normalize(path) {
  return path.split(sep).join('/');
}

function canImportPublicIndex(path) {
  const filename = basename(path);
  return filename === 'index.ts' || filename === 'index.test.ts';
}

const importPattern = /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]/g;
const violations = [];

for (const root of ['src', 'tests']) {
  for (const path of filesUnder(root).filter((file) => file.endsWith('.ts'))) {
    if (canImportPublicIndex(path)) continue;

    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1] ?? match[2];
      if (!specifier?.startsWith('.') || !specifier.endsWith('/index.ts')) continue;

      const line = source.slice(0, match.index).split('\n').length;
      violations.push(`${normalize(relative('.', path))}:${line} -> ${specifier}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Imports internos via index.ts não são permitidos:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('Imports internos válidos: caminhos relativos apontam para arquivos concretos.');
}
