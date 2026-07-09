import assert from "node:assert/strict";
import test from "node:test";
import {
  AsaasErrorMapper,
  asaasErrorMapper,
} from "../../../../src/adapters/payment-asaas/mappers/error-mapper.ts";

test("maps server and rate-limit errors as retryable", () => {
  for (const status of [429, 500, 503]) {
    const result = asaasErrorMapper.toCoreError({ status, credentials: "must-not-leak" });

    assert.deepEqual(result, {
      kind: "external",
      code: "asaas.request_failed",
      message: "Asaas request failed.",
      details: { provider: "asaas", status },
      retryable: true,
    });
  }
});

test("maps client errors as non-retryable", () => {
  const result = new AsaasErrorMapper().toCoreError({ status: 422 });

  assert.equal(result.retryable, false);
  assert.deepEqual(result.details, { provider: "asaas", status: 422 });
});

test("maps unknown failures without unsafe details", () => {
  const result = asaasErrorMapper.toCoreError(new Error("token=secret"));

  assert.deepEqual(result, {
    kind: "external",
    code: "asaas.request_failed",
    message: "Asaas request failed.",
    details: { provider: "asaas" },
    retryable: true,
  });
});
