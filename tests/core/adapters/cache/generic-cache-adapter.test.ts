import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

test("cache adapter builder delegates operations and keeps native client", async () => {
  const { GenericCacheAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/cache/index.ts"))
  );

  const client = new Map();
  const cache = new GenericCacheAdapter({
    name: "fixture-cache",
    client,
    operations: {
      get: async (client, key) => client.get(key) ?? null,
      set: async (client, key, entry) => {
        client.set(key, entry);
      },
      delete: async (client, key) => {
        client.delete(key);
      },
    },
    healthCheck: async () => ({ status: "up" }),
  });

  await cache.set("key", { value: "value" });

  assert.equal(cache instanceof GenericCacheAdapter, true);
  assert.equal(cache.client, client);
  assert.deepEqual(await cache.get("key"), { value: "value" });
  assert.deepEqual(await cache.healthCheck(), { status: "up" });

  await cache.delete("key");

  assert.equal(await cache.get("key"), null);
});

test("cache adapter exposes optional dispose only when configured", async () => {
  const { GenericCacheAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/cache/index.ts"))
  );

  const disposed = [];
  const client = new Map();
  const cache = new GenericCacheAdapter({
    name: "fixture-cache-dispose",
    client,
    operations: {
      get: async () => null,
      set: async () => undefined,
      delete: async () => undefined,
    },
    dispose: async (nativeClient) => {
      disposed.push(nativeClient);
    },
  });

  assert.equal(cache.healthCheck, undefined);
  assert.equal(typeof cache.dispose, "function");
  await cache.dispose?.();
  assert.deepEqual(disposed, [client]);
});
