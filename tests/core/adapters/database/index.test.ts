import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "src/adapters/database");
const forbiddenImports =
  /from\s+["'](?:@nestjs\/|next(?:\/|["'])|@prisma\/client|prisma|redis|ioredis|pg|mysql2|drizzle-orm|typeorm|mongodb|mongoose)|import\s*\(\s*["'](?:@nestjs\/|next(?:\/|["'])|@prisma\/client|prisma|redis|ioredis|pg|mysql2|drizzle-orm|typeorm|mongodb|mongoose)/;

test("database index loads without concrete drivers", async () => {
  const database = await import(pathToFileURL(path.join(sourceDir, "index.ts")));

  assert.equal(typeof database.DatabaseAdapterContractDefinition, "function");
  assert.equal(typeof database.GenericDatabaseAdapter, "function");
});

test("database adapter source does not import concrete drivers", async () => {
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".ts"));
  const sources = await Promise.all(
    files.map((file) => readFile(path.join(sourceDir, file), "utf8")),
  );

  assert.equal(
    sources.some((source) => forbiddenImports.test(source)),
    false,
  );
});
