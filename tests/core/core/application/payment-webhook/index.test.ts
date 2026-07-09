import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import type {
  BillingEvent,
  BillingEventRepositoryPort,
  BillingWebhookParserPort,
  BillingWebhookVerifierPort,
  FindSubscriptionByProviderSubscriptionIdInput,
  Subscription,
  SubscriptionWebhookRepositoryPort,
} from "../../../../../src/core/index.ts";

type CoreModule = typeof import("../../../../../src/core/index.ts");
type TestingModule = typeof import("../../../../../src/testing/index.ts");
type WebhookAppContextOptions = Readonly<{
  parseWebhook?: BillingWebhookParserPort["parse"];
  verifyWebhook?: BillingWebhookVerifierPort["verify"];
}>;

const rootDir = process.cwd();

const loadCore = async (): Promise<CoreModule> =>
  import(pathToFileURL(path.join(rootDir, "src/core/index.ts")).href);
const loadTesting = async (): Promise<TestingModule> =>
  import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")).href);

async function createWebhookAppContext({
  parseWebhook,
  verifyWebhook,
}: WebhookAppContextOptions = {}) {
  const core = await loadCore();
  const testing = await loadTesting();
  const subscriptions = new Map<string, Subscription>();
  const billingEvents: BillingEvent[] = [];
  const providerSubscriptionLookups: FindSubscriptionByProviderSubscriptionIdInput[] = [];
  const logger = testing.createInMemoryLogger();
  const webhookEvents = testing.createInMemoryWebhookEventRepository();
  const subscriptionRepository: SubscriptionWebhookRepositoryPort = {
    save: async (subscription) => {
      subscriptions.set(subscription.id, subscription);
    },
    findByProviderSubscriptionId: async (input) => {
      providerSubscriptionLookups.push(input);

      return (
        [...subscriptions.values()].find(
          (subscription) =>
            subscription.provider === input.provider &&
            subscription.providerSubscriptionId === input.providerSubscriptionId &&
            (input.organizationId === undefined ||
              subscription.organizationId === input.organizationId) &&
            (input.providerConnectionId === undefined ||
              subscription.providerConnectionId === input.providerConnectionId),
        ) ?? null
      );
    },
  };
  const billingEventRepository: BillingEventRepositoryPort = {
    save: async (event) => {
      billingEvents.push(event);
    },
  };
  const defaultVerifyWebhook: BillingWebhookVerifierPort["verify"] = async () =>
    core.ok({
      status: "verified",
    });
  const defaultParseWebhook: BillingWebhookParserPort["parse"] = async ({ event }) => {
    if (event.eventName === "subscription.updated") {
      return core.ok({
        kind: "subscription_status_changed",
        providerSubscriptionId: "provider_sub_1",
        providerCustomerId: "provider_customer_1",
        status: "past_due",
        currentPeriodStart: "2026-06-18T00:00:00.000Z",
        currentPeriodEnd: "2026-07-18T00:00:00.000Z",
        occurredAt: "2026-06-18T12:05:00.000Z",
      });
    }

    return core.ok({
      kind: "unknown",
      reason: "fixture event is not mapped",
    });
  };
  const appContext = core.SaasBrContext.create({
    clock: testing.createFixedClock(new Date("2026-06-18T12:00:00.000Z")),
    idGenerator: testing.createSequentialIdGenerator("id"),
    logger,
    transactionManager: testing.createPassthroughTransactionManager(),
    adapters: {},
  });

  return {
    core,
    logger,
    appContext: {
      ...appContext,
      paymentWebhookVerifier: {
        verify: verifyWebhook ?? defaultVerifyWebhook,
      },
      paymentWebhookParser: {
        parse: parseWebhook ?? defaultParseWebhook,
      },
      repositories: {
        webhookEvents,
        subscriptions: subscriptionRepository,
        billingEvents: billingEventRepository,
      },
    },
    state: {
      subscriptions,
      billingEvents,
      providerSubscriptionLookups,
      webhookEvents,
    },
  };
}

test("payment webhook receive and process are idempotent for subscription updates", async () => {
  const { core, appContext, logger, state } = await createWebhookAppContext();
  const subscription = core.Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerCustomerId: "provider_customer_1",
    providerSubscriptionId: "provider_sub_1",
    status: "active",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_webhook_1",
    actor: { type: "system" },
    organizationId: "org_1",
  });

  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);

  const received = await new core.ReceivePaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      provider: "fixture",
      providerEventId: "evt_1",
      eventName: "subscription.updated",
      organizationId: "org_1",
      providerConnectionId: "conn_1",
      providerAccountId: "acct_1",
      rawPayload: {
        id: "evt_1",
        sensitivePayloadToken: "super-secret-card-token",
      },
      headers: {
        "x-fixture-signature": "signed",
      },
    },
  );

  assert.equal(received.ok, true);
  assert.equal(received.data.outcome, "stored");
  assert.equal(received.data.verificationStatus, "verified");

  const processed = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: received.data.event.id,
    },
  );

  assert.equal(processed.ok, true);
  assert.equal(processed.data.outcome, "processed");
  assert.equal(processed.data.subscription?.status, "past_due");
  assert.equal(processed.data.billingEvent?.type, "subscription_webhook_applied");
  assert.equal(state.billingEvents.length, 1);
  assert.equal(state.subscriptions.get("sub_1")?.status, "past_due");

  const duplicate = await new core.ReceivePaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      provider: "fixture",
      providerEventId: "evt_1",
      eventName: "subscription.updated",
      organizationId: "org_1",
      providerConnectionId: "conn_1",
      rawPayload: {
        id: "evt_1",
        sensitivePayloadToken: "another-secret-token",
      },
    },
  );
  const processedAgain = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: received.data.event.id,
    },
  );

  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.data.outcome, "duplicate");
  assert.equal(duplicate.data.event.id, received.data.event.id);
  assert.equal(processedAgain.ok, true);
  assert.equal(processedAgain.data.outcome, "already_processed");
  assert.equal(state.billingEvents.length, 1);
  assert.equal(state.webhookEvents.entries.length, 1);
  assert.equal(JSON.stringify(logger.entries).includes("super-secret-card-token"), false);
  assert.equal(JSON.stringify(logger.entries).includes("another-secret-token"), false);
});

test("unknown payment webhook events are persisted and marked for analysis", async () => {
  const { core, appContext, state } = await createWebhookAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_webhook_2",
    actor: { type: "system" },
  });

  const received = await new core.ReceivePaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      provider: "fixture",
      providerEventId: "evt_unknown",
      eventName: "payment.unmapped",
      rawPayload: {
        id: "evt_unknown",
      },
    },
  );

  assert.equal(received.ok, true);

  const processed = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: received.data.event.id,
    },
  );

  assert.equal(processed.ok, true);
  assert.equal(processed.data.outcome, "unknown");
  assert.equal(processed.data.event.status, "unknown");
  assert.equal(processed.data.event.analysisReason, "fixture event is not mapped");
  assert.equal(state.billingEvents.length, 0);
});

test("unknown webhook events require explicit safe reprocessing", async () => {
  let parseMode = "unknown";
  const { core, appContext, state } = await createWebhookAppContext({
    parseWebhook: async () => {
      if (parseMode === "known") {
        return core.ok({
          kind: "subscription_status_changed",
          providerSubscriptionId: "provider_sub_1",
          status: "active",
          occurredAt: "2026-06-18T12:10:00.000Z",
        });
      }

      return core.ok({
        kind: "unknown",
        reason: "fixture event is not mapped yet",
      });
    },
  });
  const subscription = core.Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "provider_sub_1",
    status: "past_due",
    createdAt: "2026-06-01T00:00:00.000Z",
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_webhook_3",
    actor: { type: "system" },
    organizationId: "org_1",
  });

  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);

  const received = await new core.ReceivePaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      provider: "fixture",
      providerEventId: "evt_reprocess",
      eventName: "subscription.new_status",
      organizationId: "org_1",
      providerConnectionId: "conn_1",
      rawPayload: {
        id: "evt_reprocess",
      },
    },
  );

  assert.equal(received.ok, true);

  const unknown = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: received.data.event.id,
    },
  );
  const blocked = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: received.data.event.id,
    },
  );
  parseMode = "known";
  const reprocessed = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: received.data.event.id,
      allowReprocess: true,
    },
  );

  assert.equal(unknown.ok, true);
  assert.equal(unknown.data.outcome, "unknown");
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.kind, "conflict");
  assert.equal(blocked.error.code, "payment_webhook.reprocess_required");
  assert.equal(reprocessed.ok, true);
  assert.equal(reprocessed.data.outcome, "processed");
  assert.equal(state.subscriptions.get("sub_1")?.status, "active");
  assert.equal(state.billingEvents.length, 1);
});

test("webhook receive rejects invalid signatures before persistence", async () => {
  const core = await loadCore();
  const setup = await createWebhookAppContext({
    verifyWebhook: async () =>
      core.fail(
        core.createCoreError({
          kind: "authorization",
          code: "payment_webhook.signature_invalid",
          message: "Webhook signature is invalid.",
        }),
      ),
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_webhook_3",
    actor: { type: "system" },
  });

  const received = await new setup.core.ReceivePaymentWebhookUseCase(setup.appContext).execute(
    executionContext,
    {
      provider: "fixture",
      providerEventId: "evt_invalid",
      eventName: "subscription.updated",
      rawPayload: {
        id: "evt_invalid",
      },
      headers: {
        "x-fixture-signature": "invalid",
      },
    },
  );

  assert.equal(received.ok, false);
  assert.equal(received.error.kind, "authorization");
  assert.equal(setup.state.webhookEvents.entries.length, 0);
});

test("webhook receive rejects tenant mismatch and invalid webhook event projections", async () => {
  const { core, appContext, state } = await createWebhookAppContext();
  const mismatch = await new core.ReceivePaymentWebhookUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_receive_mismatch",
      actor: { type: "user", id: "user_1" },
      organizationId: "org_2",
    }),
    {
      provider: "fixture",
      providerEventId: "evt_mismatch",
      eventName: "subscription.updated",
      organizationId: "org_1",
      rawPayload: { id: "evt_mismatch" },
    },
  );

  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.error.code, "core.organization_scope_mismatch");
  assert.equal(state.webhookEvents.entries.length, 0);

  const invalidProjectionContext = {
    ...appContext,
    idGenerator: { newId: () => "" },
  };
  const invalidProjection = await new core.ReceivePaymentWebhookUseCase(
    invalidProjectionContext,
  ).execute(
    core.ExecutionContext.create({
      requestId: "req_receive_invalid_projection",
      actor: { type: "system" },
    }),
    {
      provider: "fixture",
      providerEventId: "evt_invalid_projection",
      eventName: "subscription.updated",
      rawPayload: { id: "evt_invalid_projection" },
    },
  );

  assert.equal(invalidProjection.ok, false);
  assert.equal(invalidProjection.error.kind, "validation");
  assert.equal(state.webhookEvents.entries.length, 0);
});

test("payment webhook process covers not found, tenant mismatch, parse failure and missing subscription branches", async () => {
  const { core, appContext, state } = await createWebhookAppContext({
    parseWebhook: async () =>
      core.fail(
        core.createCoreError({
          kind: "external",
          code: "payment_webhook.parse_failed",
          message: "Parse failed",
        }),
      ),
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_process_edges",
    actor: { type: "system" },
    organizationId: "org_1",
  });

  const missing = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: "missing",
    },
  );
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "payment_webhook.not_found");

  const event = core.WebhookEvent.create({
    id: "webhook_process_edge",
    provider: "fixture",
    providerEventId: "evt_process_edge",
    eventName: "subscription.updated",
    organizationId: "org_1",
    rawPayload: { id: "evt_process_edge" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(event.ok, true);
  await state.webhookEvents.save(event.data);

  const mismatch = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_process_mismatch",
      actor: { type: "user", id: "user_1" },
      organizationId: "org_2",
    }),
    {
      webhookEventId: "webhook_process_edge",
    },
  );
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.error.code, "core.organization_scope_mismatch");

  const parseFailed = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    executionContext,
    {
      webhookEventId: "webhook_process_edge",
    },
  );
  assert.equal(parseFailed.ok, false);
  assert.equal(parseFailed.error.code, "payment_webhook.parse_failed");

  const savedAfterParseFailure = await state.webhookEvents.findById("webhook_process_edge");
  assert.equal(savedAfterParseFailure?.status, "failed");
  assert.equal(savedAfterParseFailure?.lastErrorCode, "payment_webhook.parse_failed");

  const missingSubscriptionSetup = await createWebhookAppContext({
    parseWebhook: async () =>
      core.ok({
        kind: "subscription_status_changed",
        providerSubscriptionId: "provider_sub_missing",
        status: "active",
      }),
  });
  const missingSubscriptionEvent = core.WebhookEvent.create({
    id: "webhook_missing_subscription",
    provider: "fixture",
    providerEventId: "evt_missing_subscription",
    eventName: "subscription.updated",
    organizationId: "org_1",
    rawPayload: { id: "evt_missing_subscription" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(missingSubscriptionEvent.ok, true);
  await missingSubscriptionSetup.state.webhookEvents.save(missingSubscriptionEvent.data);

  const missingSubscription = await new core.ProcessPaymentWebhookUseCase(
    missingSubscriptionSetup.appContext,
  ).execute(executionContext, {
    webhookEventId: "webhook_missing_subscription",
  });
  assert.equal(missingSubscription.ok, false);
  assert.equal(missingSubscription.error.code, "payment_webhook.subscription_not_found");
});

test("payment webhook process propagates invalid subscription and billing event transitions", async () => {
  const { core, appContext, state } = await createWebhookAppContext({
    parseWebhook: async () =>
      core.ok({
        kind: "subscription_status_changed",
        providerSubscriptionId: "provider_sub_invalid",
        status: "active",
        providerCustomerId: "provider_customer_1",
      }),
  });
  const event = core.WebhookEvent.create({
    id: "webhook_invalid_subscription",
    provider: "fixture",
    providerEventId: "evt_invalid_subscription",
    eventName: "subscription.updated",
    organizationId: "org_1",
    rawPayload: { id: "evt_invalid_subscription" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(event.ok, true);
  await state.webhookEvents.save(event.data);

  state.subscriptions.set(
    "sub_invalid_projection",
    Object.freeze({
      id: "sub_invalid_projection",
      organizationId: "org_1",
      userId: "user_1",
      customerId: "customer_1",
      planId: "plan_1",
      provider: "fixture",
      providerConnectionId: "conn_1",
      providerSubscriptionId: "provider_sub_invalid",
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      metadata: Object.freeze({ source: "fixture" }),
      applyWebhookStatus(input) {
        return core.Subscription.prototype.applyWebhookStatus.call(
          { ...this, id: "", metadata: this.metadata },
          input,
        );
      },
    }),
  );

  const invalidSubscriptionResult = await new core.ProcessPaymentWebhookUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_process_invalid_subscription",
      actor: { type: "system" },
      organizationId: "org_1",
    }),
    {
      webhookEventId: "webhook_invalid_subscription",
    },
  );
  assert.equal(invalidSubscriptionResult.ok, false);
  assert.equal(invalidSubscriptionResult.error.kind, "validation");

  const billingFailureSetup = await createWebhookAppContext({
    parseWebhook: async () =>
      core.ok({
        kind: "subscription_status_changed",
        providerSubscriptionId: "provider_sub_billing_failure",
        status: "active",
      }),
  });
  const billingFailureEvent = core.WebhookEvent.create({
    id: "webhook_billing_failure",
    provider: "fixture",
    providerEventId: "evt_billing_failure",
    eventName: "subscription.updated",
    organizationId: "org_1",
    rawPayload: { id: "evt_billing_failure" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });
  const billingFailureSubscription = core.Subscription.create({
    id: "sub_billing_failure",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "provider_sub_billing_failure",
    status: "past_due",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(billingFailureEvent.ok, true);
  assert.equal(billingFailureSubscription.ok, true);
  await billingFailureSetup.state.webhookEvents.save(billingFailureEvent.data);
  billingFailureSetup.state.subscriptions.set(
    billingFailureSubscription.data.id,
    billingFailureSubscription.data,
  );

  const billingFailureContext = {
    ...billingFailureSetup.appContext,
    idGenerator: {
      newId: () => {
        return "";
      },
    },
  };

  const billingFailure = await new core.ProcessPaymentWebhookUseCase(billingFailureContext).execute(
    core.ExecutionContext.create({
      requestId: "req_process_billing_failure",
      actor: { type: "system" },
      organizationId: "org_1",
    }),
    {
      webhookEventId: "webhook_billing_failure",
    },
  );
  assert.equal(billingFailure.ok, false);
  assert.equal(billingFailure.error.kind, "validation");
});

test("PaymentWebhookSupport builds log context and enforces optional tenant scope", async () => {
  const core = await loadCore();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_webhook_support_1",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });
  const event = {
    id: "webhook_1",
    provider: "fixture",
    providerEventId: "evt_support_1",
    eventName: "subscription.updated",
    organizationId: "org_1",
  };

  const fromStatic = core.PaymentWebhookSupport.webhookLogContext(event, executionContext);
  const fromInstance = core.paymentWebhookSupport.webhookLogContext(event, executionContext);

  assert.deepEqual(fromStatic, fromInstance);
  assert.equal(fromStatic.requestId, "req_webhook_support_1");
  assert.equal(fromStatic.organizationId, "org_1");
  assert.equal(Object.isFrozen(fromStatic), true);

  const withoutOrganization = core.paymentWebhookSupport.webhookLogContext(
    { ...event, organizationId: undefined },
    executionContext,
  );
  assert.equal("organizationId" in withoutOrganization, false);

  const noScope = core.PaymentWebhookSupport.ensureWebhookTenantScope(executionContext, undefined);
  assert.equal(noScope.ok, true);

  const mismatch = core.paymentWebhookSupport.ensureWebhookTenantScope(executionContext, "org_2");
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) {
    assert.equal(mismatch.error.code, "core.organization_scope_mismatch");
  }
});

test("PaymentWebhookSupport marks failed events and persists only successful transitions", async () => {
  const { core, appContext } = await createWebhookAppContext();
  const saveCalls = [];
  const processContext = {
    ...appContext,
    repositories: {
      ...appContext.repositories,
      webhookEvents: {
        ...appContext.repositories.webhookEvents,
        save: async (event, options) => {
          saveCalls.push({ event, options });
        },
      },
    },
  };
  const eventResult = core.WebhookEvent.create({
    id: "webhook_failed_1",
    provider: "fixture",
    providerEventId: "evt_failed_1",
    eventName: "subscription.updated",
    organizationId: "org_1",
    rawPayload: { id: "evt_failed_1" },
    receivedAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(eventResult.ok, true);

  const options = Object.freeze({ transaction: Object.freeze({ id: "trx_1" }) });
  const saved = await core.PaymentWebhookSupport.markEventFailed(
    processContext,
    eventResult.data,
    "payment_webhook.parse_failed",
    options,
  );

  assert.equal(saved.ok, true);
  assert.equal(saved.data.status, "failed");
  assert.equal(saved.data.lastErrorCode, "payment_webhook.parse_failed");
  assert.equal(saveCalls.length, 1);
  assert.equal(saveCalls[0].event.id, "webhook_failed_1");
  assert.equal(saveCalls[0].options, options);

  const tooLongCode = "x".repeat(161);
  const invalid = await core.paymentWebhookSupport.markEventFailed(
    processContext,
    eventResult.data,
    tooLongCode,
    options,
  );

  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.equal(invalid.error.code, "webhookEvent.lastErrorCode.invalid");
  }
  assert.equal(saveCalls.length, 1);
});

test("PaymentWebhookSupport creates subscription webhook applied billing events", async () => {
  const core = await loadCore();
  const subscription = core.Subscription.create({
    id: "sub_support_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "prov_sub_1",
    status: "past_due",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(subscription.ok, true);

  const billingEvent = core.PaymentWebhookSupport.createSubscriptionWebhookAppliedBillingEvent({
    id: "billing_support_1",
    occurredAt: "2026-06-18T12:10:00.000Z",
    event: {
      provider: "fixture",
      providerEventId: "evt_support_2",
      eventName: "subscription.updated",
    },
    subscription: subscription.data,
  });

  assert.equal(billingEvent.ok, true);
  assert.equal(billingEvent.data.type, "subscription_webhook_applied");
  assert.equal(billingEvent.data.organizationId, "org_1");
  assert.equal(billingEvent.data.subscriptionId, "sub_support_1");
  assert.equal(billingEvent.data.metadata.providerEventId, "evt_support_2");
  assert.equal(billingEvent.data.metadata.status, "past_due");
});
