import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

test("runtime adapter builder keeps native client and creates runtime context", async () => {
  const { GenericRuntimeAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/runtime/index.ts"))
  );

  const client = {
    name: "fixture-runtime-client",
  };
  const runtime = new GenericRuntimeAdapter({
    name: "fixture-runtime",
    client,
    descriptor: {
      runtime: "fixture",
      capabilities: ["server-context"],
    },
    createContext: async (client, input) => ({
      clientName: client.name,
      requestId: input.metadata?.requestId,
    }),
    healthCheck: async () => ({ status: "up" }),
  });

  assert.equal(runtime instanceof GenericRuntimeAdapter, true);
  assert.equal(runtime.client, client);
  assert.equal(runtime.descriptor.runtime, "fixture");
  assert.deepEqual(runtime.descriptor.capabilities, ["server-context"]);
  assert.deepEqual(
    await runtime.createContext?.({
      appContext: {
        clock: { now: () => new Date("2026-06-18T00:00:00.000Z") },
        idGenerator: { newId: () => "id_1" },
        logger: {
          debug: () => undefined,
          info: () => undefined,
          warn: () => undefined,
          error: () => undefined,
        },
        transactionManager: {
          runInTransaction: async (operation) => operation({ id: "tx_1" }),
        },
        adapters: { runtime },
      },
      metadata: { requestId: "req_1" },
    }),
    { clientName: "fixture-runtime-client", requestId: "req_1" },
  );
  assert.deepEqual(await runtime.healthCheck(), { status: "up" });
});

test("runtime adapter binds dispose and can omit optional callbacks", async () => {
  const { GenericRuntimeAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/runtime/index.ts"))
  );

  const disposed = [];
  const client = { name: "runtime-client" };
  const runtime = new GenericRuntimeAdapter({
    name: "fixture-runtime-dispose",
    client,
    descriptor: {
      runtime: "fixture",
      capabilities: ["server-context"],
    },
    dispose: async (nativeClient) => {
      disposed.push(nativeClient);
    },
  });

  assert.equal(runtime.createContext, undefined);
  assert.equal(runtime.healthCheck, undefined);
  await runtime.dispose?.();
  assert.deepEqual(disposed, [client]);
});
