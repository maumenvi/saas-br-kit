import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const forbiddenCoreImports = [
  /from\s+["']@nestjs\//,
  /from\s+["']next(?:\/|["'])/,
  /from\s+["'](?:@prisma\/client|prisma)["']/,
  /from\s+["'](?:redis|ioredis)["']/,
  /from\s+["']pino["']/,
  /from\s+["'][^"']*asaas[^"']*["']/i,
  /from\s+["'](?:axios|mongodb|mongoose|zod)["']/,
  /import\s*\(\s*["'](?:@nestjs\/|next(?:\/|["'])|@prisma\/client|prisma|redis|ioredis|pino|axios|mongodb|mongoose|zod)/,
];

const listFiles = async (dir, extension = ".ts") => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(fullPath, extension);
      }
      return entry.isFile() && entry.name.endsWith(extension) ? [fullPath] : [];
    }),
  );

  return files.flat();
};

const assertNoPatterns = async (files, patterns, label) => {
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(source)) {
        violations.push(`${path.relative(rootDir, file)} matched ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, [], label);
};

test("core public module loads without concrete framework or adapter dependencies", async () => {
  const core = await import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));

  assert.equal(typeof core.ExecutionContext, "function");
  assert.equal(typeof core.SaasBrContext, "function");
  assert.equal(typeof core.CreateOrganizationUseCase, "function");
  assert.equal(typeof core.ok, "function");
});

test("core source does not import forbidden runtime dependencies", async () => {
  const coreFiles = await listFiles(path.join(rootDir, "src/core"));

  await assertNoPatterns(
    coreFiles,
    forbiddenCoreImports,
    "core must stay framework, adapter, driver and Zod free",
  );
});

test("core domain and application expose class-based entities and use cases", async () => {
  const files = [
    ...(await listFiles(path.join(rootDir, "src/core/domain"))),
    ...(await listFiles(path.join(rootDir, "src/core/application"))),
  ];
  const sourceByFile = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const source = sourceByFile.join("\n");

  for (const expectedClass of [
    "Organization",
    "Plan",
    "Subscription",
    "BillingEvent",
    "AuditEvent",
    "CreateOrganizationUseCase",
    "CreatePlanUseCase",
    "CreateSubscriptionUseCase",
  ]) {
    assert.match(source, new RegExp(`class\\s+${expectedClass}\\b`));
  }
});
