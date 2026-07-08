import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "src/adapters/cache");
const forbiddenImports =
  /from\s+["'](?:@nestjs\/|next(?:\/|["'])|@prisma\/client|prisma|redis|ioredis|pg|mysql2|drizzle-orm|typeorm|mongodb|mongoose)|import\s*\(\s*["'](?:@nestjs\/|next(?:\/|["'])|@prisma\/client|prisma|redis|ioredis|pg|mysql2|drizzle-orm|typeorm|mongodb|mongoose)/;

test("cache index loads without concrete drivers", async () => {
  const cache = await import(pathToFileURL(path.join(sourceDir, "index.ts")));

  assert.equal(typeof cache.CacheAdapterContractDefinition, "function");
  assert.equal(typeof cache.GenericCacheAdapter, "function");
});

test("cache adapter source does not import concrete drivers", async () => {
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".ts"));
  const sources = await Promise.all(
    files.map((file) => readFile(path.join(sourceDir, file), "utf8")),
  );

  assert.equal(
    sources.some((source) => forbiddenImports.test(source)),
    false,
  );
});
