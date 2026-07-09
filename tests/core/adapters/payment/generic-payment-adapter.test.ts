import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

test("payment adapter builder keeps descriptor and native client", async () => {
  const { GenericPaymentAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/payment/index.ts"))
  );

  const client = {
    createCharge: async () => ({ id: "charge_1" }),
  };
  const payment = new GenericPaymentAdapter({
    name: "fixture-payment",
    client,
    descriptor: {
      provider: "fixture",
      capabilities: ["subscription"],
    },
    healthCheck: async () => ({ status: "up" }),
  });

  assert.equal(payment instanceof GenericPaymentAdapter, true);
  assert.equal(payment.client, client);
  assert.equal(payment.descriptor.provider, "fixture");
  assert.deepEqual(payment.descriptor.capabilities, ["subscription"]);
  assert.deepEqual(await payment.client.createCharge(), { id: "charge_1" });
  assert.deepEqual(await payment.healthCheck(), { status: "up" });
});

test("payment adapter clones capabilities and binds optional dispose", async () => {
  const { GenericPaymentAdapter } = await import(
    pathToFileURL(path.join(rootDir, "src/adapters/payment/index.ts"))
  );

  const capabilities = ["subscription"];
  const disposed = [];
  const client = { provider: "fixture" };
  const payment = new GenericPaymentAdapter({
    name: "fixture-payment-dispose",
    client,
    descriptor: {
      provider: "fixture",
      capabilities,
    },
    dispose: async (nativeClient) => {
      disposed.push(nativeClient);
    },
  });
  capabilities.push("invoice");

  assert.deepEqual(payment.descriptor.capabilities, ["subscription"]);
  assert.equal(payment.healthCheck, undefined);
  await payment.dispose?.();
  assert.deepEqual(disposed, [client]);
});
