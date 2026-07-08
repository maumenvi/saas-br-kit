import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const importCore = () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));
const importTesting = () => import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")));

const createTechnicalPorts = async () => {
  const { createFixedClock, createNoopLogger, createSequentialIdGenerator } = await importTesting();

  return {
    clock: createFixedClock(new Date("2026-06-18T00:00:00.000Z")),
    idGenerator: createSequentialIdGenerator("ctx"),
    logger: createNoopLogger(),
  };
};

test("SaasBrContext.create freezes long-lived context and clones adapter collections", async () => {
  const { SaasBrContext } = await importCore();
  const ports = await createTechnicalPorts();
  const explicitTransactionManager = Object.freeze({
    runInTransaction: async (operation) => operation(Object.freeze({ id: "explicit_tx" })),
  });
  const databaseTransactionManager = Object.freeze({
    runInTransaction: async (operation) => operation(Object.freeze({ id: "database_tx" })),
  });
  const payment = Object.freeze({ name: "payment" });
  const payments = [payment];
  const database = Object.freeze({
    name: "database",
    transactionManager: databaseTransactionManager,
  });

  const context = SaasBrContext.create({
    ...ports,
    transactionManager: explicitTransactionManager,
    adapters: {
      database,
      payments,
    },
  });

  payments.push(Object.freeze({ name: "late_payment" }));

  assert.equal(context.clock, ports.clock);
  assert.equal(context.idGenerator, ports.idGenerator);
  assert.equal(context.logger, ports.logger);
  assert.equal(context.transactionManager, explicitTransactionManager);
  assert.equal(context.adapters.database, database);
  assert.deepEqual(context.adapters.payments, [payment]);
  assert.equal(Object.isFrozen(context), true);
  assert.equal(Object.isFrozen(context.adapters), true);
  assert.equal(Object.isFrozen(context.adapters.payments), true);
  assert.throws(() => Object.assign(context, { logger: null }), TypeError);
  assert.throws(() => context.adapters.payments.push(payment), TypeError);
});

test("SaasBrContext.create infers transaction manager from database adapter", async () => {
  const { SaasBrContext } = await importCore();
  const ports = await createTechnicalPorts();
  const databaseTransactionManager = Object.freeze({
    runInTransaction: async (operation) => operation(Object.freeze({ id: "database_tx" })),
  });

  const context = SaasBrContext.create({
    ...ports,
    adapters: {
      database: {
        name: "database",
        transactionManager: databaseTransactionManager,
      },
    },
  });

  const transactionId = await context.transactionManager.runInTransaction(async (transaction) => {
    assert.equal(Object.isFrozen(transaction), true);
    return transaction.id;
  });

  assert.equal(context.transactionManager, databaseTransactionManager);
  assert.equal(transactionId, "database_tx");
});

test("SaasBrContext.create rejects missing transaction manager", async () => {
  const { SaasBrContext } = await importCore();
  const ports = await createTechnicalPorts();

  assert.throws(
    () =>
      SaasBrContext.create({
        ...ports,
      }),
    /requires transactionManager or adapters\.database\.transactionManager/,
  );
});

test("SaasBrContext.create supplies clock, UUIDv7 and console logger defaults", async () => {
  const { SaasBrContext } = await importCore();
  const context = SaasBrContext.create({
    transactionManager: {
      runInTransaction: async (operation) => operation(Object.freeze({ id: "default_tx" })),
    },
  });

  assert.equal(context.clock.now() instanceof Date, true);
  assert.match(
    context.idGenerator.newId(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.equal(typeof context.logger.info, "function");
});
