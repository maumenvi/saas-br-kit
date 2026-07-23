import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const distPath = resolve(projectRoot, 'dist');

if (distPath !== `${projectRoot}/dist`) {
  throw new Error(`Caminho de distribuição inesperado: ${distPath}`);
}

await rm(distPath, { force: true, recursive: true });
