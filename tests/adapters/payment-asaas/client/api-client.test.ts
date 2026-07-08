import assert from "node:assert/strict";
import test from "node:test";
import {
  AsaasApiClient,
  AsaasApiError,
  createAsaasApiClient,
} from "../../../../src/adapters/payment-asaas/client/api-client.ts";

test("creates customers with authenticated JSON requests", async () => {
  const requests: RequestRecord[] = [];
  const client = createAsaasApiClient({
    accessToken: "secret",
    baseUrl: "https://asaas.test/v3",
    fetcher: recordingFetcher(requests, { id: "cus_1", name: "Ada" }),
  });

  const customer = await client.createCustomer({ name: "Ada", email: "ada@example.com" });

  assert.equal(client instanceof AsaasApiClient, true);
  assert.deepEqual(customer, { id: "cus_1", name: "Ada" });
  assert.deepEqual(requests, [
    {
      url: "https://asaas.test/v3/customers",
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: "secret",
        },
        body: JSON.stringify({ name: "Ada", email: "ada@example.com" }),
      },
    },
  ]);
});

test("creates subscriptions using the default sandbox URL", async () => {
  const requests: RequestRecord[] = [];
  const client = createAsaasApiClient({
    accessToken: "secret",
    fetcher: recordingFetcher(requests, { id: "sub_1", customer: "cus_1" }),
  });
  const input = {
    customer: "cus_1",
    billingType: "PIX" as const,
    value: 49.9,
    nextDueDate: "2026-07-01",
    cycle: "MONTHLY" as const,
  };

  await client.createSubscription(input);

  assert.equal(requests[0]?.url, "https://sandbox.asaas.com/api/v3/subscriptions");
  assert.equal(requests[0]?.init.body, JSON.stringify(input));
});

test("uses the global fetch implementation when none is injected", async () => {
  const requests: RequestRecord[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = recordingFetcher(requests, {});

  try {
    await createAsaasApiClient({ accessToken: "secret" }).healthCheck();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, 1);
});

test("performs health checks without a request body", async () => {
  const requests: RequestRecord[] = [];
  const client = createAsaasApiClient({
    accessToken: "secret",
    fetcher: recordingFetcher(requests, {}),
  });

  await client.healthCheck();

  assert.equal(requests[0]?.url, "https://sandbox.asaas.com/api/v3/customers?limit=1");
  assert.equal(requests[0]?.init.method, "GET");
  assert.equal("body" in (requests[0]?.init ?? {}), false);
});

test("cancels URL-encoded subscriptions with DELETE and no request body", async () => {
  const requests: RequestRecord[] = [];
  const client = createAsaasApiClient({
    accessToken: "secret",
    baseUrl: "https://asaas.test/v3",
    fetcher: recordingFetcher(requests, {}),
  });

  await client.cancelSubscription("sub/with spaces");

  assert.equal(requests[0]?.url, "https://asaas.test/v3/subscriptions/sub%2Fwith%20spaces");
  assert.equal(requests[0]?.init.method, "DELETE");
  assert.equal("body" in (requests[0]?.init ?? {}), false);
});

test("throws a sanitized API error for unsuccessful responses", async () => {
  const client = createAsaasApiClient({
    accessToken: "secret",
    fetcher: (async () =>
      new Response(JSON.stringify({ errors: [{ description: "invalid customer" }] }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch,
  });

  await assert.rejects(client.createCustomer({ name: "Ada" }), (error: unknown) => {
    assert.equal(error instanceof AsaasApiError, true);
    const apiError = error as AsaasApiError;
    assert.equal(apiError.name, "AsaasApiError");
    assert.equal(apiError.message, "Asaas API request failed.");
    assert.equal(apiError.status, 422);
    assert.deepEqual(apiError.payload, {
      errors: [{ description: "invalid customer" }],
    });
    assert.equal(JSON.stringify(error).includes("secret"), false);
    return true;
  });
});

test("preserves an undefined payload when an error response is not JSON", async () => {
  const client = createAsaasApiClient({
    accessToken: "secret",
    fetcher: (async () => new Response("gateway error", { status: 502 })) as typeof fetch,
  });

  await assert.rejects(client.healthCheck(), (error: unknown) => {
    assert.equal(error instanceof AsaasApiError, true);
    assert.equal((error as AsaasApiError).status, 502);
    assert.equal((error as AsaasApiError).payload, undefined);
    return true;
  });
});

type RequestRecord = {
  url: string;
  init: RequestInit;
};

function recordingFetcher(requests: RequestRecord[], responseBody: unknown): typeof fetch {
  return (async (input: URL | RequestInfo, init?: RequestInit) => {
    requests.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}
