import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const run = (command, args, options = {}) => {
  const executable = process.platform === "win32" && command === "npm" ? "cmd.exe" : command;
  const commandArgs =
    process.platform === "win32" && command === "npm" ? ["/d", "/s", "/c", "npm", ...args] : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: options.cwd ?? rootDir,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.error.message}`);
  }

  assert.equal(
    result.status,
    0,
    [
      `${command} ${args.join(" ")} failed with status ${result.status}`,
      result.stdout,
      result.stderr,
    ].join("\n"),
  );

  return result;
};

test("package tarball installs in an external TypeScript fixture", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "saas-br-sdk-package-"));

  try {
    const packDir = path.join(workspace, "pack");
    const fixtureDir = path.join(workspace, "fixture");
    await writeFile(path.join(workspace, "README.md"), "temporary package test workspace\n");
    await mkdir(packDir, { recursive: true });
    await mkdir(fixtureDir, { recursive: true });

    const packResult = run("npm", ["pack", "--json", "--pack-destination", packDir]);
    const [packInfo] = JSON.parse(packResult.stdout);
    const packagedTypeScriptSources = packInfo.files
      .map((file) => file.path)
      .filter((filePath) => filePath.endsWith(".ts") && !filePath.endsWith(".d.ts"));

    assert.deepEqual(
      packagedTypeScriptSources,
      [],
      "distributed package must contain JavaScript runtime files, not TypeScript source",
    );

    const tarballPath = path.join(packDir, packInfo.filename);
    const tarballSpec = pathToFileURL(tarballPath).href;

    await writeFile(
      path.join(fixtureDir, "package.json"),
      JSON.stringify(
        {
          name: "saas-br-sdk-fixture",
          version: "0.0.0",
          private: true,
          type: "module",
          dependencies: {
            "@maumenvi/saas-br-kit": tarballSpec,
          },
          devDependencies: {},
        },
        null,
        2,
      ),
    );

    await writeFile(
      path.join(fixtureDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ),
    );

    await mkdir(path.join(fixtureDir, "src"), { recursive: true });
    await writeFile(
      path.join(fixtureDir, "src/index.ts"),
      [
        'import { ExecutionContext, SaasBrContext, SaasBrCore, coreProperties, ok } from "@maumenvi/saas-br-kit/core";',
        'import { coreErrorSchema, executionContextSchema, validateSchema } from "@maumenvi/saas-br-kit/contracts";',
        'import { DatabaseAdapterContractDefinition, GenericDatabaseAdapter } from "@maumenvi/saas-br-kit/adapters/database";',
        'import { CacheAdapterContractDefinition, GenericCacheAdapter } from "@maumenvi/saas-br-kit/adapters/cache";',
        'import { GenericPaymentAdapter, PaymentAdapterContractDefinition } from "@maumenvi/saas-br-kit/adapters/payment";',
        'import { GenericRuntimeAdapter, RuntimeAdapterContractDefinition } from "@maumenvi/saas-br-kit/adapters/runtime";',
        'import { prismaCoreAdapter } from "@maumenvi/saas-br-kit/adapters/database-prisma";',
        'import { nestCoreAdapter, SaasBrModule } from "@maumenvi/saas-br-kit/adapters/runtime-nest";',
        'import { asaasCoreAdapter, createAsaasApiClient } from "@maumenvi/saas-br-kit/adapters/payment-asaas";',
        'import { createFixedClock, createInMemoryMembershipRepository, createInMemoryWebhookEventRepository, createNoopLogger, createSequentialIdGenerator } from "@maumenvi/saas-br-kit/testing";',
        "",
        "type FixtureTransactionClient = { queryRaw: (query: string) => Promise<string[]> };",
        "const databaseClient = {",
        "  queryRaw: async (query: string) => [query],",
        "  transaction: async <TValue>(operation: (client: FixtureTransactionClient) => Promise<TValue>) =>",
        '    operation({ queryRaw: async (query: string) => ["tx:" + query] }),',
        "};",
        "const database = new GenericDatabaseAdapter<typeof databaseClient, FixtureTransactionClient>({",
        '  name: "fixture-database",',
        "  client: databaseClient,",
        "  transaction: {",
        "    run: (client, operation) => client.transaction(operation),",
        "  },",
        "  healthCheck: async (client) => {",
        '    await client.queryRaw("SELECT 1");',
        '    return { status: "up" };',
        "  },",
        "});",
        "type FixtureCacheEntry<TValue> = { value: TValue };",
        "const cache = new GenericCacheAdapter({",
        '  name: "fixture-cache",',
        "  client: new Map<string, unknown>(),",
        "  operations: {",
        "    get: async <TValue>(client: Map<string, unknown>, key: string) =>",
        "      (client.get(key) as FixtureCacheEntry<TValue> | undefined) ?? null,",
        "    set: async (client, key, entry) => {",
        "      client.set(key, entry);",
        "    },",
        "    delete: async (client, key) => {",
        "      client.delete(key);",
        "    },",
        "  },",
        "});",
        "const payment = new GenericPaymentAdapter({",
        '  name: "fixture-payment",',
        '  client: { createCharge: async () => ({ id: "charge_1" }) },',
        '  descriptor: { provider: "fixture", capabilities: ["subscription"] },',
        "});",
        "const runtime = new GenericRuntimeAdapter({",
        '  name: "fixture-runtime",',
        '  client: { createRequestContext: async () => ({ requestId: "req_1" }) },',
        '  descriptor: { runtime: "fixture", capabilities: ["server-context"] },',
        "  createContext: async (client) => client.createRequestContext(),",
        "});",
        "const appContext = SaasBrContext.create({",
        '  clock: createFixedClock(new Date("2026-06-18T00:00:00.000Z")),',
        "  idGenerator: createSequentialIdGenerator(),",
        "  logger: createNoopLogger(),",
        "  adapters: { database, cache, payments: [payment], runtime },",
        "});",
        "const composed = await SaasBrCore.create()",
        "  .add(coreProperties({ transactionManager: database.transactionManager }))",
        "  .build();",
        'const executionContext = ExecutionContext.create({ requestId: "req_1", actor: { type: "system" } });',
        'new DatabaseAdapterContractDefinition({ name: "fixture", createAdapter: () => database });',
        'new CacheAdapterContractDefinition({ name: "fixture", createAdapter: () => cache });',
        'new PaymentAdapterContractDefinition({ name: "fixture", createProvider: () => payment });',
        'new RuntimeAdapterContractDefinition({ name: "fixture", createAdapter: () => runtime });',
        'await appContext.adapters.database.client.queryRaw("SELECT * FROM fixture");',
        'await appContext.adapters.database.withTransaction((db) => db.queryRaw("SELECT * FROM fixture"));',
        'await appContext.adapters.cache.set("key", { value: "value" });',
        "await appContext.adapters.payments[0].client.createCharge();",
        "await appContext.adapters.runtime.createContext?.({ appContext });",
        "validateSchema(executionContextSchema, executionContext);",
        'validateSchema(coreErrorSchema, { kind: "validation", code: "fixture", message: "Fixture error" });',
        "createFixedClock(new Date()).now();",
        "createInMemoryMembershipRepository().clear();",
        "createInMemoryWebhookEventRepository().clear();",
        "void prismaCoreAdapter;",
        "void nestCoreAdapter;",
        "void SaasBrModule;",
        "void asaasCoreAdapter;",
        "void createAsaasApiClient;",
        "ok(appContext);",
        "ok(composed.appContext);",
      ].join("\n"),
    );

    run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: fixtureDir });
    run(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-save",
        "--no-audit",
        "--no-fund",
        "@nestjs/common@^11.1.27",
        "@nestjs/core@^11.1.27",
        "@nestjs/swagger@^11.4.4",
        "@nestjs/testing@^11.1.27",
        "reflect-metadata@^0.2.2",
        "rxjs@^7.8.2",
      ],
      { cwd: fixtureDir },
    );

    const tscPath = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");
    run("node", [tscPath, "-p", "tsconfig.json"], { cwd: fixtureDir });
    run(
      "node",
      [
        "--input-type=module",
        "--eval",
        [
          'import "@maumenvi/saas-br-kit/core";',
          'import "@maumenvi/saas-br-kit/adapters/database-prisma";',
          'import "@maumenvi/saas-br-kit/adapters/runtime-nest";',
          'import "@maumenvi/saas-br-kit/adapters/payment-asaas";',
        ].join("\n"),
      ],
      { cwd: fixtureDir },
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
