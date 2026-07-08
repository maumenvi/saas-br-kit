import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const loadCache = async () =>
  import(pathToFileURL(path.join(rootDir, "src/adapters/cache/index.ts")).href);
const loadDatabase = async () =>
  import(pathToFileURL(path.join(rootDir, "src/adapters/database/index.ts")).href);
const loadPayment = async () =>
  import(pathToFileURL(path.join(rootDir, "src/adapters/payment/index.ts")).href);
const loadRuntime = async () =>
  import(pathToFileURL(path.join(rootDir, "src/adapters/runtime/index.ts")).href);

test("adapter contract definitions keep contract factory and freeze metadata", async () => {
  const { CacheAdapterContractDefinition } = await loadCache();
  const { DatabaseAdapterContractDefinition } = await loadDatabase();
  const { PaymentAdapterContractDefinition } = await loadPayment();
  const { RuntimeAdapterContractDefinition } = await loadRuntime();

  const cacheFactory = () => ({
    name: "cache",
    client: new Map(),
    get: async () => null,
    set: async () => {},
    delete: async () => {},
  });
  const databaseFactory = () => ({
    name: "db",
    getClient: () => ({}),
    withTransaction: async (operation) => operation({}),
    transactionManager: { runInTransaction: async (operation) => operation({ id: "tx" }) },
  });
  const providerFactory = () => ({
    provider: "fixture",
    capabilities: ["subscription"],
  });
  const runtimeFactory = () => ({
    name: "runtime",
    client: {},
    descriptor: { runtime: "fixture", capabilities: ["server-context"] },
  });

  const cache = new CacheAdapterContractDefinition({
    name: "cache-contract",
    createAdapter: cacheFactory,
  });
  const database = new DatabaseAdapterContractDefinition({
    name: "database-contract",
    createAdapter: databaseFactory,
  });
  const payment = new PaymentAdapterContractDefinition({
    name: "payment-contract",
    createProvider: providerFactory,
  });
  const runtime = new RuntimeAdapterContractDefinition({
    name: "runtime-contract",
    createAdapter: runtimeFactory,
  });

  assert.equal(cache.name, "cache-contract");
  assert.equal(database.name, "database-contract");
  assert.equal(payment.name, "payment-contract");
  assert.equal(runtime.name, "runtime-contract");

  assert.equal(cache.createAdapter, cacheFactory);
  assert.equal(database.createAdapter, databaseFactory);
  assert.equal(payment.createProvider, providerFactory);
  assert.equal(runtime.createAdapter, runtimeFactory);

  assert.equal(Object.isFrozen(cache), true);
  assert.equal(Object.isFrozen(database), true);
  assert.equal(Object.isFrozen(payment), true);
  assert.equal(Object.isFrozen(runtime), true);
});
