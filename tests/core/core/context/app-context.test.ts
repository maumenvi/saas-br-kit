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

test("SaasBrContext.create throws when transaction manager is not passed", async () => {
  const { SaasBrContext } = await importCore();
  const ports = await createTechnicalPorts();

  assert.throws(() =>
    SaasBrContext.create({
      clock: ports.clock,
      idGenerator: ports.idGenerator,
      logger: ports.logger,
    }),
    {
      name: "CoreFunctionalityNotConfiguredError",
      functionality: "transactionManager",
    });
});

test("SaasBrContext.create throws when clock, idGenerator or logger are not passed", async () => {
  const { SaasBrContext } = await importCore();
  const transactionManager = Object.freeze({
    runInTransaction: async (operation) => operation(Object.freeze({ id: "default_tx" })),
  });

  assert.throws(() =>
    SaasBrContext.create({
      idGenerator: {
        newId: () => "id_1",
      },
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
      transactionManager,
    }),
    {
      name: "CoreFunctionalityNotConfiguredError",
      functionality: "clock",
    });

  assert.throws(() =>
    SaasBrContext.create({
      clock: {
        now: () => new Date("2026-06-18T00:00:00.000Z"),
      },
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
      transactionManager,
    }),
    {
      name: "CoreFunctionalityNotConfiguredError",
      functionality: "idGenerator",
    });

  assert.throws(() =>
    SaasBrContext.create({
      clock: {
        now: () => new Date("2026-06-18T00:00:00.000Z"),
      },
      idGenerator: {
        newId: () => "id_1",
      },
      transactionManager,
    }),
    {
      name: "CoreFunctionalityNotConfiguredError",
      functionality: "logger",
    });
});

test("SaasBrContext.create keeps runtime-dependent capabilities behind missing functionality proxies", async () => {
  const { SaasBrContext } = await importCore();
  const ports = await createTechnicalPorts();

  const context = SaasBrContext.create({
    ...ports,
    transactionManager: {
      runInTransaction: async (operation) => operation(Object.freeze({ id: "runtime_tx" })),
    },
  });

  assert.throws(() => context.paymentProviderSelector.select(), {
    name: "CoreFunctionalityNotConfiguredError",
    functionality: "paymentProviderSelector.select",
  });
});
