import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")).href);
const loadTesting = async () =>
  import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")).href);

type CreateSubscriptionFixtureOptions = {
  providerResult?: unknown;
  providerConnectionStatus?: string;
  providerCapabilities?: string[];
  cancelResult?: unknown;
};

function createSubscriptionMemoryRepositories() {
  const organizations = new Map();
  const plans = new Map();
  const subscriptions = new Map();
  const customers = new Map();
  const billingEvents: Array<{ type: string }> = [];
  const auditEvents: Array<{ type: string }> = [];

  const repositories = {
    organizations: {
      save: async (organization) => organizations.set(organization.id, organization),
      findById: async (organizationId) => organizations.get(organizationId) ?? null,
    },
    plans: {
      save: async (plan) => plans.set(plan.id, plan),
      findById: async (organizationId, planId) => {
        const plan = plans.get(planId) ?? null;
        return plan?.organizationId === organizationId ? plan : null;
      },
    },
    subscriptions: {
      save: async (subscription) => subscriptions.set(subscription.id, subscription),
      findById: async (subscriptionId) => subscriptions.get(subscriptionId) ?? null,
      findCurrentByOrganizationId: async (organizationId) =>
        [...subscriptions.values()].find(
          (subscription) =>
            subscription.organizationId === organizationId &&
            !["canceled", "expired"].includes(subscription.status),
        ) ?? null,
      listByOrganizationId: async (organizationId) =>
        [...subscriptions.values()].filter(
          (subscription) => subscription.organizationId === organizationId,
        ),
    },
    customers: {
      save: async (customer) => customers.set(customer.id, customer),
      findById: async (customerId) => customers.get(customerId) ?? null,
      findByEmail: async (email) => {
        const normalized = email.trim().toLowerCase();
        return [...customers.values()].find((customer) => customer.email === normalized) ?? null;
      },
    },
    billingEvents: {
      save: async (event) => billingEvents.push(event),
    },
    auditEvents: {
      save: async (event) => auditEvents.push(event),
    },
  };

  return {
    repositories,
    state: {
      organizations,
      plans,
      subscriptions,
      customers,
      billingEvents,
      auditEvents,
    },
  };
}

async function createSubscriptionFixture({
  providerResult,
  providerConnectionStatus = "active",
  providerCapabilities = ["subscription"],
  cancelResult,
}: CreateSubscriptionFixtureOptions = {}) {
  const core = await loadCore();
  const testing = await loadTesting();
  const memory = createSubscriptionMemoryRepositories();
  const providerRequests: Array<{
    type: "create" | "cancel" | "select";
    input: unknown;
  }> = [];

  const appContext = core.SaasBrContext.create({
    clock: testing.createFixedClock(new Date("2026-06-18T12:00:00.000Z")),
    idGenerator: testing.createSequentialIdGenerator("id"),
    logger: testing.createNoopLogger(),
    transactionManager: testing.createPassthroughTransactionManager(),
    adapters: {},
  });

  const provider = {
    provider: "fixture",
    capabilities: providerCapabilities,
    createCustomerAndSubscription: async (input) => {
      providerRequests.push({ type: "create", input });
      return (
        providerResult ??
        core.ok({
          providerCustomerId: "cust_1",
          providerSubscriptionId: "prov_sub_1",
          status: "active",
          currentPeriodStart: "2026-06-18T00:00:00.000Z",
          currentPeriodEnd: "2026-07-18T00:00:00.000Z",
        })
      );
    },
    cancelSubscription: async (input) => {
      providerRequests.push({ type: "cancel", input });
      return cancelResult ?? core.ok(undefined);
    },
  };

  const paymentProviderSelector = {
    selectProvider: async (input) => {
      providerRequests.push({ type: "select", input });
      return core.ok({
        connection: {
          id: "conn_1",
          organizationId: input.organizationId,
          provider: "fixture",
          status: providerConnectionStatus,
        },
        provider,
      });
    },
  };

  return {
    core,
    appContext: {
      ...appContext,
      repositories: memory.repositories,
      paymentProviderSelector,
    },
    state: {
      ...memory.state,
      providerRequests,
    },
  };
}

async function seedOrganizationAndPlan(core, state, organizationId = "org_1", planId = "plan_1") {
  const organization = core.Organization.create({
    id: organizationId,
    ownerUserId: "user_1",
    name: "My organization",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const plan = core.Plan.create({
    id: planId,
    organizationId,
    code: "pro",
    name: "Pro",
    amountCents: 9900,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(plan.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  state.plans.set(plan.data.id, plan.data);
  return { organization: organization.data, plan: plan.data };
}

function seedCustomer(core, state, organizationId: string, customerId: string) {
  const customer = core.Customer.create({
    id: customerId,
    organizationId,
    name: `Customer ${customerId}`,
    email: `${customerId}@example.com`,
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: { segment: "b2b" },
  });
  assert.equal(customer.ok, true);
  state.customers.set(customer.data.id, customer.data);
  return customer.data;
}

test("CreateSubscriptionUseCase creates an active provider-backed subscription", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const customer = seedCustomer(core, state, organization.id, "customer_1");
  const executionContext = core.ExecutionContext.create({
    requestId: "req_create_success",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: customer.id,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.subscription.status, "active");
  assert.equal(result.data.subscription.providerSubscriptionId, "prov_sub_1");
  assert.equal(state.subscriptions.size, 1);
  const lastBillingEvent = state.billingEvents.at(-1);
  const lastAuditEvent = state.auditEvents.at(-1);
  assert.ok(lastBillingEvent);
  assert.ok(lastAuditEvent);
  assert.equal(lastBillingEvent.type, "subscription_created");
  assert.equal(lastAuditEvent.type, "billing.subscription_created");
});

test("CreateSubscriptionUseCase rejects inactive provider connection", async () => {
  const { core, appContext, state } = await createSubscriptionFixture({
    providerConnectionStatus: "inactive",
  });
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_connection_inactive",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: "customer_1",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "payment_provider.connection_inactive");
  assert.equal(state.subscriptions.size, 0);
});

test("CreateSubscriptionUseCase rejects provider without subscription capability", async () => {
  const { core, appContext, state } = await createSubscriptionFixture({
    providerCapabilities: ["invoice"],
  });
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_capability_unsupported",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: "customer_1",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "payment_provider.subscription_unsupported");
  assert.equal(state.subscriptions.size, 0);
});

test("CreateSubscriptionUseCase allows multiple open subscriptions for the same plan", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const customer = seedCustomer(core, state, organization.id, "customer_1");
  const current = core.Subscription.create({
    id: "sub_current",
    organizationId: organization.id,
    planId: plan.id,
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_conflict",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: customer.id,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.subscription.planId, plan.id);
  assert.equal(result.data.subscription.id !== current.data.id, true);
  assert.equal(state.subscriptions.size, 2);
});

test("CreateSubscriptionUseCase rejects create when customer already has an open subscription", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const customer = core.Customer.create({
    id: "customer_1",
    organizationId: organization.id,
    name: "Customer One",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const current = core.Subscription.create({
    id: "sub_customer_open",
    organizationId: organization.id,
    customerId: "customer_1",
    planId: plan.id,
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(customer.ok, true);
  assert.equal(current.ok, true);
  state.customers.set(customer.data.id, customer.data);
  state.subscriptions.set(current.data.id, current.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_customer_conflict",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: "customer_1",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "subscription.customer_current_conflict");
  assert.equal(state.subscriptions.size, 1);
});

test("CreateSubscriptionUseCase records incomplete state when provider fails", async () => {
  const core = await loadCore();
  const { appContext, state } = await createSubscriptionFixture({
    providerResult: {
      ok: false,
      error: {
        kind: "external",
        code: "payment_provider.timeout",
        message: "Timeout",
      },
    },
  });
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const customer = seedCustomer(core, state, organization.id, "customer_1");
  const executionContext = core.ExecutionContext.create({
    requestId: "req_provider_fail",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: customer.id,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "payment_provider.timeout");
  const stored = [...state.subscriptions.values()].at(-1);
  assert.equal(stored?.status, "incomplete");
  const lastBillingEvent = state.billingEvents.at(-1);
  const lastAuditEvent = state.auditEvents.at(-1);
  assert.ok(lastBillingEvent);
  assert.ok(lastAuditEvent);
  assert.equal(lastBillingEvent.type, "subscription_provider_failed");
  assert.equal(lastAuditEvent.type, "billing.subscription_provider_failed");
});

test("GetSubscriptionUseCase returns not found for unknown subscription", async () => {
  const { core, appContext } = await createSubscriptionFixture();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_get_missing",
    actor: { type: "system" },
  });

  const result = await new core.GetSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "missing",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "subscription.not_found");
});

test("GetSubscriptionUseCase enforces tenant scope mismatch", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const subscription = core.Subscription.create({
    id: "sub_tenant",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_scope_mismatch",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_2",
  });

  const result = await new core.GetSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "sub_tenant",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "core.organization_scope_mismatch");
});

test("ListSubscriptionsUseCase lists subscriptions only for the requested organization", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const sub1 = core.Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const sub2 = core.Subscription.create({
    id: "sub_2",
    organizationId: "org_2",
    planId: "plan_2",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(sub1.ok, true);
  assert.equal(sub2.ok, true);
  state.subscriptions.set(sub1.data.id, sub1.data);
  state.subscriptions.set(sub2.data.id, sub2.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_list",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.ListSubscriptionsUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.data.map((subscription) => subscription.id),
    ["sub_1"],
  );
});

test("UpdateSubscriptionUseCase updates user and clears metadata when null", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const current = core.Subscription.create({
    id: "sub_update",
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: { source: "seed" },
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_update",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.UpdateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "sub_update",
    userId: "user_2",
    metadata: null,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.userId, "user_2");
  assert.equal(result.data.metadata, undefined);
});

test("UpdateSubscriptionUseCase returns not found when subscription does not exist", async () => {
  const { core, appContext } = await createSubscriptionFixture();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_update_missing",
    actor: { type: "system" },
  });

  const result = await new core.UpdateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "sub_missing",
    metadata: { source: "updated" },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "subscription.not_found");
});

test("CancelSubscriptionUseCase cancels externally and persists local canceled status", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const current = core.Subscription.create({
    id: "sub_cancel",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "prov_sub_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_cancel",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.CancelSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "sub_cancel",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.status, "canceled");
  const selectCall = state.providerRequests.find((call) => call.type === "select");
  assert.ok(selectCall);
  assert.equal((selectCall.input as { requestedProvider?: string }).requestedProvider, "fixture");
  assert.equal(
    state.providerRequests.some((call) => call.type === "cancel"),
    true,
  );
});

test("CancelSubscriptionUseCase propagates provider cancellation failure", async () => {
  const core = await loadCore();
  const { appContext, state } = await createSubscriptionFixture({
    cancelResult: {
      ok: false,
      error: {
        kind: "external",
        code: "payment_provider.cancel_failed",
        message: "Cancel failed",
      },
    },
  });
  const current = core.Subscription.create({
    id: "sub_cancel_fail",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "prov_sub_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_cancel_fail",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.CancelSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "sub_cancel_fail",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "payment_provider.cancel_failed");
  assert.equal(state.subscriptions.get("sub_cancel_fail").status, "active");
});

test("RequireSubscriptionAccessUseCase denies missing and inactive subscriptions", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_access_denied",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const missing = await new core.RequireSubscriptionAccessUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
    },
  );

  const inactive = core.Subscription.create({
    id: "sub_inactive",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "past_due",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(inactive.ok, true);
  state.subscriptions.set(inactive.data.id, inactive.data);

  const denied = await new core.RequireSubscriptionAccessUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
    },
  );

  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "subscription.access_denied");
  assert.equal(missing.error.details.reason, "subscription_missing");

  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "subscription.access_denied");
  assert.equal(denied.error.details.reason, "subscription_inactive");
  assert.equal(denied.error.details.status, "past_due");
});

test("RequireSubscriptionAccessUseCase allows active subscription", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const active = core.Subscription.create({
    id: "sub_active",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-30T00:00:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(active.ok, true);
  state.subscriptions.set(active.data.id, active.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_access_allowed",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.RequireSubscriptionAccessUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.allowed, true);
  assert.equal(result.data.reason, "subscription_active");
  assert.equal(result.data.subscriptionId, "sub_active");
});

test("CreateSubscriptionUseCase validates selected provider resolution and requestedProvider forwarding", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const customer = seedCustomer(core, state, organization.id, "customer_1");
  const executionContext = core.ExecutionContext.create({
    requestId: "req_selected_provider",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: customer.id,
    requestedProvider: "fixture",
  });

  assert.equal(result.ok, true);
  const selectCall = state.providerRequests.find((call) => call.type === "select");
  assert.ok(selectCall);
  assert.equal((selectCall.input as { requestedProvider?: string }).requestedProvider, "fixture");

  const selectorFailure = {
    ...appContext,
    paymentProviderSelector: {
      selectProvider: async () =>
        core.fail({
          kind: "external",
          code: "payment_provider.unavailable",
          message: "Provider unavailable",
        }),
    },
  };

  const failed = await new core.CreateSubscriptionUseCase(selectorFailure).execute(
    executionContext,
    {
      organizationId: organization.id,
      userId: "user_1",
      planId: plan.id,
      customerId: customer.id,
    },
  );
  assert.equal(failed.ok, false);
  assert.equal(failed.error.code, "payment_provider.unavailable");
});

test("CreateSubscriptionUseCase rejects missing active organization/plan/customer combinations", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_create_prereq",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const missingOrganization = await new core.CreateSubscriptionUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      customerId: "customer_1",
    },
  );
  assert.equal(missingOrganization.ok, false);
  assert.equal(missingOrganization.error.code, "organization.not_found");

  const inactiveOrganization = core.Organization.create({
    id: "org_1",
    ownerUserId: "user_1",
    name: "Inactive org",
    status: "disabled",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(inactiveOrganization.ok, true);
  state.organizations.set("org_1", inactiveOrganization.data);

  const inactiveOrganizationResult = await new core.CreateSubscriptionUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      customerId: "customer_1",
    },
  );
  assert.equal(inactiveOrganizationResult.ok, false);
  assert.equal(inactiveOrganizationResult.error.code, "organization.not_found");

  const activeOrganization = core.Organization.create({
    id: "org_1",
    ownerUserId: "user_1",
    name: "Active org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const inactivePlan = core.Plan.create({
    id: "plan_1",
    organizationId: "org_1",
    code: "pro",
    name: "Pro",
    amountCents: 9900,
    interval: "monthly",
    status: "inactive",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(activeOrganization.ok, true);
  assert.equal(inactivePlan.ok, true);
  state.organizations.set("org_1", activeOrganization.data);
  state.plans.set("plan_1", inactivePlan.data);

  const inactivePlanResult = await new core.CreateSubscriptionUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      customerId: "customer_1",
    },
  );
  assert.equal(inactivePlanResult.ok, false);
  assert.equal(inactivePlanResult.error.code, "plan.not_found");

  const activePlan = core.Plan.create({
    id: "plan_1",
    organizationId: "org_1",
    code: "pro",
    name: "Pro",
    amountCents: 9900,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(activePlan.ok, true);
  state.plans.set("plan_1", activePlan.data);

  const wrongTenantCustomer = core.Customer.create({
    id: "customer_1",
    organizationId: "org_2",
    name: "Wrong tenant",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(wrongTenantCustomer.ok, true);
  state.customers.set("customer_1", wrongTenantCustomer.data);

  const wrongTenantCustomerResult = await new core.CreateSubscriptionUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
      userId: "user_1",
      planId: "plan_1",
      customerId: "customer_1",
    },
  );
  assert.equal(wrongTenantCustomerResult.ok, false);
  assert.equal(wrongTenantCustomerResult.error.code, "customer.not_found");
});

test("Update and cancel subscription use cases validate tenant scope and organization ownership", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const subscription = core.Subscription.create({
    id: "sub_scope",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "prov_sub_scope",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);

  const mismatchedScopeContext = core.ExecutionContext.create({
    requestId: "req_scope_mismatch",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_2",
  });

  const updateScopeMismatch = await new core.UpdateSubscriptionUseCase(appContext).execute(
    mismatchedScopeContext,
    {
      organizationId: "org_1",
      subscriptionId: "sub_scope",
      metadata: { source: "update" },
    },
  );
  assert.equal(updateScopeMismatch.ok, false);
  assert.equal(updateScopeMismatch.error.code, "core.organization_scope_mismatch");

  const cancelScopeMismatch = await new core.CancelSubscriptionUseCase(appContext).execute(
    mismatchedScopeContext,
    {
      organizationId: "org_1",
      subscriptionId: "sub_scope",
    },
  );
  assert.equal(cancelScopeMismatch.ok, false);
  assert.equal(cancelScopeMismatch.error.code, "core.organization_scope_mismatch");

  const scopedContext = core.ExecutionContext.create({
    requestId: "req_scope_ok",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const updateWrongOrg = await new core.UpdateSubscriptionUseCase(appContext).execute(
    scopedContext,
    {
      organizationId: "org_2",
      subscriptionId: "sub_scope",
      metadata: { source: "update" },
    },
  );
  assert.equal(updateWrongOrg.ok, false);
  assert.equal(updateWrongOrg.error.code, "core.organization_scope_mismatch");

  const cancelNotFound = await new core.CancelSubscriptionUseCase(appContext).execute(
    scopedContext,
    {
      organizationId: "org_1",
      subscriptionId: "sub_missing",
    },
  );
  assert.equal(cancelNotFound.ok, false);
  assert.equal(cancelNotFound.error.code, "subscription.not_found");
});

test("UpdateSubscriptionUseCase propagates validation failure when local projection becomes invalid", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const current = core.Subscription.create({
    id: "sub_invalid_update",
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_update_invalid_user",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.UpdateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    subscriptionId: "sub_invalid_update",
    userId: "",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "validation");
  assert.equal(state.subscriptions.get("sub_invalid_update").userId, "user_1");
});

test("UpdateSubscriptionUseCase preserves provider linkage and periods when updating metadata", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const current = core.Subscription.create({
    id: "sub_optional_projection",
    organizationId: "org_1",
    userId: "user_1",
    customerId: "customer_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerCustomerId: "prov_customer_1",
    providerSubscriptionId: "prov_subscription_1",
    status: "active",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);

  const result = await new core.UpdateSubscriptionUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_update_projection",
      actor: { type: "user", id: "user_1" },
      organizationId: "org_1",
    }),
    {
      organizationId: "org_1",
      subscriptionId: "sub_optional_projection",
      metadata: { source: "projection-update" },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.customerId, "customer_1");
  assert.equal(result.data.providerCustomerId, "prov_customer_1");
  assert.equal(result.data.providerSubscriptionId, "prov_subscription_1");
  assert.equal(result.data.currentPeriodStart, "2026-06-01T00:00:00.000Z");
  assert.equal(result.data.currentPeriodEnd, "2026-07-01T00:00:00.000Z");
  assert.deepEqual(result.data.metadata, { source: "projection-update" });
});

test("CreateSubscriptionUseCase rejects missing customer and invalid provider application payloads", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const { organization, plan } = await seedOrganizationAndPlan(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_subscription_missing_customer",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  const missingCustomer = await new core.CreateSubscriptionUseCase(appContext).execute(
    executionContext,
    {
      organizationId: organization.id,
      userId: "user_1",
      planId: plan.id,
      customerId: "missing_customer",
    },
  );
  assert.equal(missingCustomer.ok, false);
  assert.equal(missingCustomer.error.code, "customer.not_found");

  seedCustomer(core, state, organization.id, "customer_1");
  const invalidProviderPayloadContext = {
    ...appContext,
    paymentProviderSelector: {
      selectProvider: async (input) =>
        core.ok({
          connection: {
            id: "conn_1",
            organizationId: input.organizationId,
            provider: "fixture",
            status: "active",
          },
          provider: {
            provider: "fixture",
            capabilities: ["subscription"],
            createCustomerAndSubscription: async () =>
              core.ok({
                providerCustomerId: "   ",
                providerSubscriptionId: "prov_sub_1",
                status: "active",
              }),
          },
        }),
    },
  };

  const invalidProviderPayload = await new core.CreateSubscriptionUseCase(
    invalidProviderPayloadContext,
  ).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: "customer_1",
  });
  assert.equal(invalidProviderPayload.ok, false);
  assert.equal(invalidProviderPayload.error.code, "subscription.providerCustomerId.invalid");
});

test("CreateSubscriptionUseCase propagates billing and audit event validation failures", async () => {
  const first = await createSubscriptionFixture();
  const { organization, plan } = await seedOrganizationAndPlan(first.core, first.state);
  seedCustomer(first.core, first.state, organization.id, "customer_1");
  const executionContext = first.core.ExecutionContext.create({
    requestId: "req_subscription_event_failures",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.id,
  });

  let calls = 0;
  const billingEventFailureContext = {
    ...first.appContext,
    idGenerator: {
      newId: () => {
        calls += 1;
        return calls === 2 ? "" : `sub_ok_${calls}`;
      },
    },
  };
  const billingEventFailure = await new first.core.CreateSubscriptionUseCase(
    billingEventFailureContext,
  ).execute(executionContext, {
    organizationId: organization.id,
    userId: "user_1",
    planId: plan.id,
    customerId: "customer_1",
  });
  assert.equal(billingEventFailure.ok, false);
  assert.equal(billingEventFailure.error.kind, "validation");

  const second = await createSubscriptionFixture();
  const secondSeed = await seedOrganizationAndPlan(second.core, second.state);
  seedCustomer(second.core, second.state, secondSeed.organization.id, "customer_1");
  const secondExecutionContext = second.core.ExecutionContext.create({
    requestId: "req_subscription_audit_failure",
    actor: { type: "user", id: "user_1" },
    organizationId: secondSeed.organization.id,
  });

  calls = 0;
  const auditEventFailureContext = {
    ...second.appContext,
    idGenerator: {
      newId: () => {
        calls += 1;
        return calls === 3 ? "" : `sub_ok_${calls}`;
      },
    },
  };
  const auditEventFailure = await new second.core.CreateSubscriptionUseCase(
    auditEventFailureContext,
  ).execute(secondExecutionContext, {
    organizationId: secondSeed.organization.id,
    userId: "user_1",
    planId: secondSeed.plan.id,
    customerId: "customer_1",
  });
  assert.equal(auditEventFailure.ok, false);
  assert.equal(auditEventFailure.error.kind, "validation");
});

test("CancelSubscriptionUseCase propagates provider selection and invalid local projection failures", async () => {
  const { core, appContext, state } = await createSubscriptionFixture();
  const current = core.Subscription.create({
    id: "sub_cancel_edge",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "prov_sub_edge",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(current.ok, true);
  state.subscriptions.set(current.data.id, current.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_cancel_edge",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const selectorFailureContext = {
    ...appContext,
    paymentProviderSelector: {
      selectProvider: async () =>
        core.fail({
          kind: "external",
          code: "payment_provider.selection_failed",
          message: "Selection failed",
        }),
    },
  };
  const selectorFailure = await new core.CancelSubscriptionUseCase(selectorFailureContext).execute(
    executionContext,
    {
      organizationId: "org_1",
      subscriptionId: "sub_cancel_edge",
    },
  );
  assert.equal(selectorFailure.ok, false);
  assert.equal(selectorFailure.error.code, "payment_provider.selection_failed");

  state.subscriptions.set(
    "sub_cancel_invalid",
    Object.freeze({
      ...current.data,
      id: "sub_cancel_invalid",
      applyWebhookStatus(input) {
        return core.Subscription.prototype.applyWebhookStatus.call({ ...this, id: "" }, input);
      },
    }),
  );

  const invalidProjection = await new core.CancelSubscriptionUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
      subscriptionId: "sub_cancel_invalid",
    },
  );
  assert.equal(invalidProjection.ok, false);
  assert.equal(invalidProjection.error.kind, "validation");
});
