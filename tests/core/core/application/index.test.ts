import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));
const loadTesting = async () => import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")));

function createMemoryRepositories() {
  const organizations = new Map();
  const plans = new Map();
  const subscriptions = new Map();
  const customers = new Map();
  const billingEvents = [];
  const auditEvents = [];
  const transactions = [];

  const repositories = {
    organizations: {
      save: async (organization, options) => {
        transactions.push(options?.transaction?.id ?? null);
        organizations.set(organization.id, organization);
      },
      findById: async (organizationId) => organizations.get(organizationId) ?? null,
      listByOwnerUserId: async (ownerUserId) =>
        [...organizations.values()].filter(
          (organization) => organization.ownerUserId === ownerUserId,
        ),
    },
    plans: {
      save: async (plan, options) => {
        transactions.push(options?.transaction?.id ?? null);
        plans.set(plan.id, plan);
      },
      findById: async (organizationId, planId) => {
        const plan = plans.get(planId) ?? null;
        return plan?.organizationId === organizationId ? plan : null;
      },
      findByCode: async (organizationId, code) =>
        [...plans.values()].find(
          (plan) => plan.organizationId === organizationId && plan.code === code.toLowerCase(),
        ) ?? null,
      listByOrganizationId: async (organizationId) =>
        [...plans.values()].filter((plan) => plan.organizationId === organizationId),
    },
    subscriptions: {
      save: async (subscription, options) => {
        transactions.push(options?.transaction?.id ?? null);
        subscriptions.set(subscription.id, subscription);
      },
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
      save: async (customer) => {
        customers.set(customer.id, customer);
      },
      findById: async (customerId) => customers.get(customerId) ?? null,
      findByEmail: async (email) => {
        const normalized = email.trim().toLowerCase();
        return [...customers.values()].find((customer) => customer.email === normalized) ?? null;
      },
      listByOrganizationId: async (organizationId) =>
        [...customers.values()].filter((customer) => customer.organizationId === organizationId),
    },
    billingEvents: {
      save: async (event, options) => {
        transactions.push(options?.transaction?.id ?? null);
        billingEvents.push(event);
      },
    },
    auditEvents: {
      save: async (event, options) => {
        transactions.push(options?.transaction?.id ?? null);
        auditEvents.push(event);
      },
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
      transactions,
    },
  };
}

async function createAppContext({ providerResult, providerConnectionStatus = "active" } = {}) {
  const core = await loadCore();
  const testing = await loadTesting();
  const memory = createMemoryRepositories();
  const providerRequests = [];
  const appContext = core.SaasBrContext.create({
    clock: testing.createFixedClock(new Date("2026-06-18T12:00:00.000Z")),
    idGenerator: testing.createSequentialIdGenerator("id"),
    logger: testing.createNoopLogger(),
    transactionManager: testing.createPassthroughTransactionManager(),
    adapters: {},
  });
  const provider = {
    provider: "fixture",
    capabilities: ["subscription"],
    createCustomerAndSubscription: async (input) => {
      providerRequests.push(input);

      return (
        providerResult ??
        core.ok({
          providerCustomerId: "cust_1",
          providerSubscriptionId: "prov_sub_1",
          status: "active",
          currentPeriodStart: "2026-06-18T12:00:00.000Z",
          currentPeriodEnd: "2026-07-18T12:00:00.000Z",
        })
      );
    },
    cancelSubscription: async (input) => {
      providerRequests.push(input);
      return core.ok(undefined);
    },
  };
  const paymentProviderSelector = {
    selectProvider: async () =>
      core.ok({
        connection: {
          id: "conn_1",
          organizationId: "org_1",
          provider: "fixture",
          status: providerConnectionStatus,
        },
        provider,
      }),
  };

  return {
    core,
    appContext: {
      ...appContext,
      repositories: memory.repositories,
      paymentProviderSelector,
    },
    ...memory,
    state: {
      ...memory.state,
      providerRequests,
    },
  };
}

test("CreateOrganizationUseCase persists an organization for the represented owner", async () => {
  const { core, appContext, state } = await createAppContext();

  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
  });

  const result = await new core.CreateOrganizationUseCase(appContext).execute(executionContext, {
    ownerUserId: "user_1",
    name: "Minha empresa",
    metadata: { source: "self-service", seats: 10 },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.id, "id_1");
  assert.equal(result.data.ownerUserId, "user_1");
  assert.deepEqual(result.data.metadata, { source: "self-service", seats: 10 });
  assert.equal(state.organizations.get("id_1"), result.data);
  assert.deepEqual(state.transactions, ["test_transaction_1"]);
});

test("CreateOrganizationUseCase rejects actor and owner mismatch", async () => {
  const { core, appContext, state } = await createAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
  });

  const result = await new core.CreateOrganizationUseCase(appContext).execute(executionContext, {
    ownerUserId: "user_2",
    name: "Outra empresa",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "authorization");
  assert.equal(result.error.code, "core.actor_user_mismatch");
  assert.equal(state.organizations.size, 0);
});

test("CreatePlanUseCase persists plan and billing event with permission", async () => {
  const { core, appContext, state } = await createAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
    permissions: ["billing:plans:write"],
  });

  const result = await new core.CreatePlanUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    code: " PRO ",
    name: "Pro",
    amountCents: 9900,
    interval: "monthly",
    metadata: { source: "admin", featured: true },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.plan.id, "id_1");
  assert.equal(result.data.plan.organizationId, "org_1");
  assert.equal(result.data.plan.code, "pro");
  assert.deepEqual(result.data.plan.metadata, { source: "admin", featured: true });
  assert.equal(result.data.billingEvent.type, "plan_created");
  assert.equal(result.data.billingEvent.organizationId, "org_1");
  assert.equal(result.data.auditEvent.type, "billing.plan_created");
  assert.equal(result.data.auditEvent.organizationId, "org_1");
  assert.equal(result.data.auditEvent.requestId, "req_1");
  assert.equal(result.data.auditEvent.actorType, "user");
  assert.equal(result.data.auditEvent.actorId, "user_1");
  assert.equal(state.plans.get("id_1"), result.data.plan);
  assert.equal(state.billingEvents.length, 1);
  assert.equal(state.auditEvents.length, 1);
  assert.equal(state.auditEvents[0], result.data.auditEvent);
});

test("CreatePlanUseCase scopes duplicate normalized codes by organization", async () => {
  const { core, appContext, state } = await createAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "system" },
  });

  const first = await new core.CreatePlanUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    code: "pro",
    name: "Pro",
    amountCents: 9900,
    interval: "monthly",
  });
  const duplicate = await new core.CreatePlanUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    code: " PRO ",
    name: "Pro duplicate",
    amountCents: 12900,
    interval: "monthly",
  });
  const otherOrganization = await new core.CreatePlanUseCase(appContext).execute(executionContext, {
    organizationId: "org_2",
    code: " PRO ",
    name: "Pro for another organization",
    amountCents: 12900,
    interval: "monthly",
  });

  assert.equal(first.ok, true);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error.kind, "conflict");
  assert.equal(duplicate.error.code, "plan.code_conflict");
  assert.equal(otherOrganization.ok, true);
  assert.equal(otherOrganization.data.plan.organizationId, "org_2");
  assert.equal(state.plans.size, 2);
});

test("CreateSubscriptionUseCase creates provider-backed subscription and billing event", async () => {
  const { core, appContext, state } = await createAppContext();
  const ownerContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
  });
  const billingContext = core.ExecutionContext.create({
    requestId: "req_2",
    actor: { type: "user", id: "user_1" },
    organizationId: "id_1",
  });

  const organization = await new core.CreateOrganizationUseCase(appContext).execute(ownerContext, {
    ownerUserId: "user_1",
    name: "Minha empresa",
  });
  const plan = await new core.CreatePlanUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_admin", actor: { type: "system" } }),
    {
      organizationId: organization.data.id,
      code: "pro",
      name: "Pro",
      amountCents: 9900,
      interval: "monthly",
    },
  );

  assert.equal(organization.ok, true);
  assert.equal(plan.ok, true);
  const customer = core.Customer.create({
    id: "customer_1",
    organizationId: organization.data.id,
    name: "Cliente Teste",
    email: "cliente@example.com",
    document: "12345678000199",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: {
      segment: "agency",
      employees: 12,
      trial: false,
    },
  });
  assert.equal(customer.ok, true);
  state.customers.set(customer.data.id, customer.data);

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(billingContext, {
    organizationId: organization.data.id,
    userId: "user_1",
    planId: plan.data.plan.id,
    customerId: customer.data.id,
    metadata: {
      campaign: "launch",
      seats: 12,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.subscription.status, "active");
  assert.equal(result.data.subscription.providerCustomerId, "cust_1");
  assert.equal(result.data.subscription.providerSubscriptionId, "prov_sub_1");
  assert.deepEqual(result.data.subscription.metadata, {
    campaign: "launch",
    seats: 12,
  });
  assert.equal(result.data.billingEvent.type, "subscription_created");
  assert.equal(result.data.auditEvent.type, "billing.subscription_created");
  assert.equal(result.data.auditEvent.organizationId, organization.data.id);
  assert.equal(state.auditEvents.at(-1), result.data.auditEvent);
  assert.equal(state.subscriptions.get(result.data.subscription.id), result.data.subscription);
  assert.equal(state.billingEvents.at(-1).metadata.provider, "fixture");
  assert.deepEqual(state.providerRequests.at(-1).customer.metadata, {
    segment: "agency",
    employees: 12,
    trial: false,
  });
  assert.equal(Object.isFrozen(state.providerRequests.at(-1).customer.metadata), true);
});

test("CreateSubscriptionUseCase references an existing organization customer", async () => {
  const { core, appContext, state } = await createAppContext();
  const organization = core.Organization.create({
    id: "org_existing_customer",
    ownerUserId: "user_1",
    name: "Existing customer organization",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const plan = core.Plan.create({
    id: "plan_existing_customer",
    organizationId: "org_existing_customer",
    code: "existing-customer",
    name: "Existing customer",
    amountCents: 9900,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const customer = core.Customer.create({
    id: "customer_existing",
    organizationId: "org_existing_customer",
    name: "Persisted Customer",
    email: "persisted@example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: { origin: "crm" },
  });
  assert.equal(organization.ok, true);
  assert.equal(plan.ok, true);
  assert.equal(customer.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  state.plans.set(plan.data.id, plan.data);
  state.customers.set(customer.data.id, customer.data);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_existing_customer",
    actor: { type: "user", id: "user_1" },
    organizationId: organization.data.id,
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: organization.data.id,
    userId: "user_1",
    planId: plan.data.id,
    customerId: customer.data.id,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.subscription.customerId, customer.data.id);
  assert.equal(state.customers.size, 1);
  assert.deepEqual(state.providerRequests.at(-1).customer, {
    name: "Persisted Customer",
    email: "persisted@example.com",
    metadata: { origin: "crm" },
  });
});

test("CreateSubscriptionUseCase rejects customers from another organization", async () => {
  const { core, appContext, state } = await createAppContext();
  const organization = core.Organization.create({
    id: "org_1",
    ownerUserId: "user_1",
    name: "Organization",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const plan = core.Plan.create({
    id: "plan_1",
    organizationId: "org_1",
    code: "cross-tenant",
    name: "Cross tenant",
    amountCents: 9900,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const customer = core.Customer.create({
    id: "customer_other_tenant",
    organizationId: "org_other",
    name: "Other tenant",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(plan.ok, true);
  assert.equal(customer.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  state.plans.set(plan.data.id, plan.data);
  state.customers.set(customer.data.id, customer.data);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_wrong_customer_tenant",
    actor: { type: "system" },
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    customerId: customer.data.id,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "customer.not_found");
  assert.equal(state.subscriptions.size, 0);
});

test("CreateSubscriptionUseCase rejects plans from another organization", async () => {
  const { core, appContext, state } = await createAppContext();
  const organization = core.Organization.create({
    id: "org_1",
    ownerUserId: "user_1",
    name: "Organization",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const plan = core.Plan.create({
    id: "plan_other_tenant",
    organizationId: "org_2",
    code: "cross-tenant-plan",
    name: "Cross tenant plan",
    amountCents: 9900,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(plan.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  state.plans.set(plan.data.id, plan.data);

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_cross_tenant_plan", actor: { type: "system" } }),
    {
      organizationId: "org_1",
      userId: "user_1",
      planId: plan.data.id,
      customerId: "customer_1",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "plan.not_found");
  assert.equal(state.subscriptions.size, 0);
  assert.equal(state.providerRequests.length, 0);
});

test("CreateSubscriptionUseCase records incomplete state when provider returns a normalized failure", async () => {
  const core = await loadCore();
  const providerResult = {
    ok: false,
    error: {
      kind: "external",
      code: "payment_provider.unavailable",
      message: "Payment provider is unavailable.",
      retryable: true,
    },
  };
  const setup = await createAppContext({ providerResult });
  const { appContext, state } = setup;
  const organization = core.Organization.create({
    id: "org_1",
    ownerUserId: "user_1",
    name: "Minha empresa",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const plan = core.Plan.create({
    id: "plan_1",
    organizationId: "org_1",
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
  const customer = core.Customer.create({
    id: "customer_1",
    organizationId: "org_1",
    name: "Cliente Teste",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(customer.ok, true);
  state.customers.set(customer.data.id, customer.data);

  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    customerId: "customer_1",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "external");
  assert.equal(state.subscriptions.size, 1);
  const [subscription] = state.subscriptions.values();
  assert.equal(subscription.status, "incomplete");
  assert.equal(state.billingEvents.at(-1).type, "subscription_provider_failed");
  assert.equal(state.auditEvents.at(-1).type, "billing.subscription_provider_failed");
  assert.equal(state.auditEvents.at(-1).organizationId, "org_1");
  assert.deepEqual(state.billingEvents.at(-1).metadata, {
    provider: "fixture",
    providerErrorCode: "payment_provider.unavailable",
    providerErrorKind: "external",
  });
});

test("CreateSubscriptionUseCase rejects organization scope mismatch", async () => {
  const { core, appContext } = await createAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_other",
  });

  const result = await new core.CreateSubscriptionUseCase(appContext).execute(executionContext, {
    organizationId: "org_1",
    userId: "user_1",
    planId: "plan_1",
    customerId: "customer_1",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "authorization");
  assert.equal(result.error.code, "core.organization_scope_mismatch");
});

test("RequireSubscriptionAccessUseCase blocks inactive subscriptions", async () => {
  const { core, appContext, state } = await createAppContext();
  const subscription = core.Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "past_due",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);

  const result = await new core.RequireSubscriptionAccessUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "authorization");
  assert.equal(result.error.code, "subscription.access_denied");
  assert.equal(result.error.details.reason, "subscription_inactive");
});

test("RequireSubscriptionAccessUseCase allows active subscriptions", async () => {
  const { core, appContext, state } = await createAppContext();
  const subscription = core.Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    currentPeriodStart: "2026-06-18T00:00:00.000Z",
    currentPeriodEnd: "2026-07-18T00:00:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_1",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);

  const result = await new core.RequireSubscriptionAccessUseCase(appContext).execute(
    executionContext,
    {
      organizationId: "org_1",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.allowed, true);
  assert.equal(result.data.reason, "subscription_active");
});

test("organization CRUD reads, lists, updates and soft-disables without deleting", async () => {
  const { core, appContext, state } = await createAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_organization_crud",
    actor: { type: "user", id: "owner_1" },
  });
  const created = await new core.CreateOrganizationUseCase(appContext).execute(executionContext, {
    ownerUserId: "owner_1",
    name: "Original",
    subdomain: "original",
    url: "https://original.example.com",
    metadata: { nested: { enabled: true }, tags: ["one"] },
  });
  assert.equal(created.ok, true);

  const read = await new core.GetOrganizationUseCase(appContext).execute(executionContext, {
    organizationId: created.data.id,
  });
  const listed = await new core.ListOrganizationsUseCase(appContext).execute(executionContext, {
    ownerUserId: "owner_1",
  });
  const updated = await new core.UpdateOrganizationUseCase(appContext).execute(executionContext, {
    organizationId: created.data.id,
    name: "Updated",
    subdomain: null,
    url: null,
    metadata: null,
  });
  const disabled = await new core.DisableOrganizationUseCase(appContext).execute(executionContext, {
    organizationId: created.data.id,
  });

  assert.equal(read.ok, true);
  assert.equal(listed.ok, true);
  assert.deepEqual(
    listed.data.map((organization) => organization.id),
    [created.data.id],
  );
  assert.equal(updated.ok, true);
  assert.equal(updated.data.name, "Updated");
  assert.equal(updated.data.subdomain, undefined);
  assert.equal(updated.data.url, undefined);
  assert.equal(updated.data.metadata, undefined);
  assert.equal(disabled.ok, true);
  assert.equal(disabled.data.status, "disabled");
  assert.equal(state.organizations.size, 1);
  assert.equal(state.organizations.get(created.data.id).status, "disabled");
});

test("organization CRUD hides missing records and rejects another actor", async () => {
  const { core, appContext, state } = await createAppContext();
  const owner = core.ExecutionContext.create({
    requestId: "req_owner",
    actor: { type: "user", id: "owner_1" },
  });
  const other = core.ExecutionContext.create({
    requestId: "req_other",
    actor: { type: "user", id: "owner_2" },
  });
  const created = await new core.CreateOrganizationUseCase(appContext).execute(owner, {
    ownerUserId: "owner_1",
    name: "Private",
  });
  assert.equal(created.ok, true);

  const forbidden = await new core.GetOrganizationUseCase(appContext).execute(other, {
    organizationId: created.data.id,
  });
  const missing = await new core.GetOrganizationUseCase(appContext).execute(owner, {
    organizationId: "missing",
  });

  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.kind, "authorization");
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "organization.not_found");
  assert.equal(state.organizations.size, 1);
});

test("ListOrganizationsUseCase enforces actor ownership and repository support", async () => {
  const { core, appContext, state } = await createAppContext();
  const owner = core.ExecutionContext.create({
    requestId: "req_list_owner",
    actor: { type: "user", id: "owner_1" },
  });
  const other = core.ExecutionContext.create({
    requestId: "req_list_other",
    actor: { type: "user", id: "owner_2" },
  });

  const created = await new core.CreateOrganizationUseCase(appContext).execute(owner, {
    ownerUserId: "owner_1",
    name: "Listable",
  });
  assert.equal(created.ok, true);

  const forbidden = await new core.ListOrganizationsUseCase(appContext).execute(other, {
    ownerUserId: "owner_1",
  });
  const unsupported = await new core.ListOrganizationsUseCase({
    ...appContext,
    repositories: {
      ...appContext.repositories,
      organizations: {
        save: appContext.repositories.organizations.save,
        findById: appContext.repositories.organizations.findById,
      },
    },
  }).execute(owner, {
    ownerUserId: "owner_1",
  });

  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.code, "core.actor_user_mismatch");
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.error.code, "organization.list_unsupported");
  assert.equal(state.organizations.size, 1);
});

test("UpdateOrganizationUseCase rejects invalid updates and preserves persisted organization", async () => {
  const { core, appContext, state } = await createAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_update_invalid",
    actor: { type: "user", id: "owner_1" },
  });
  const created = await new core.CreateOrganizationUseCase(appContext).execute(executionContext, {
    ownerUserId: "owner_1",
    name: "Stable Org",
  });
  assert.equal(created.ok, true);

  const invalidName = await new core.UpdateOrganizationUseCase(appContext).execute(
    executionContext,
    {
      organizationId: created.data.id,
      name: "A",
    },
  );

  assert.equal(invalidName.ok, false);
  assert.equal(invalidName.error.code, "organization.name.invalid");
  assert.equal(state.organizations.get(created.data.id).name, "Stable Org");
});

test("DisableOrganizationUseCase propagates validation failures from persisted organization state", async () => {
  const { core, appContext, state } = await createAppContext();
  const ownerContext = core.ExecutionContext.create({
    requestId: "req_disable_invalid",
    actor: { type: "user", id: "owner_1" },
  });

  state.organizations.set(
    "org_invalid_role_config",
    Object.freeze({
      id: "org_invalid_role_config",
      ownerUserId: "owner_1",
      name: "Broken org",
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      roleConfig: Object.freeze({
        ownerRoleName: "owner",
        employeeRoles: Object.freeze([]),
      }),
    }),
  );

  const result = await new core.DisableOrganizationUseCase(appContext).execute(ownerContext, {
    organizationId: "org_invalid_role_config",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "organization.roleConfig.employeeRoles.empty");
  assert.equal(state.organizations.get("org_invalid_role_config").status, "active");
});

test("UpdateOrganizationUseCase returns not found and forbids non-owner actor", async () => {
  const { core, appContext } = await createAppContext();
  const owner = core.ExecutionContext.create({
    requestId: "req_update_owner",
    actor: { type: "user", id: "owner_1" },
  });
  const other = core.ExecutionContext.create({
    requestId: "req_update_other",
    actor: { type: "user", id: "owner_2" },
  });

  const created = await new core.CreateOrganizationUseCase(appContext).execute(owner, {
    ownerUserId: "owner_1",
    name: "Owner org",
  });
  assert.equal(created.ok, true);

  const missing = await new core.UpdateOrganizationUseCase(appContext).execute(owner, {
    organizationId: "org_missing",
    name: "Does not matter",
  });
  const forbidden = await new core.UpdateOrganizationUseCase(appContext).execute(other, {
    organizationId: created.data.id,
    name: "Blocked update",
  });

  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "organization.not_found");
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.code, "core.actor_user_mismatch");
});

test("DisableOrganizationUseCase returns not found and forbids non-owner actor", async () => {
  const { core, appContext, state } = await createAppContext();
  const owner = core.ExecutionContext.create({
    requestId: "req_disable_owner",
    actor: { type: "user", id: "owner_1" },
  });
  const other = core.ExecutionContext.create({
    requestId: "req_disable_other",
    actor: { type: "user", id: "owner_2" },
  });

  const created = await new core.CreateOrganizationUseCase(appContext).execute(owner, {
    ownerUserId: "owner_1",
    name: "Disable org",
  });
  assert.equal(created.ok, true);

  const missing = await new core.DisableOrganizationUseCase(appContext).execute(owner, {
    organizationId: "org_missing",
  });
  const forbidden = await new core.DisableOrganizationUseCase(appContext).execute(other, {
    organizationId: created.data.id,
  });

  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "organization.not_found");
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.code, "core.actor_user_mismatch");
  assert.equal(state.organizations.get(created.data.id).status, "active");
});

test("UpdateOrganizationUseCase applies explicit optional fields and roleConfig", async () => {
  const { core, appContext } = await createAppContext();
  const owner = core.ExecutionContext.create({
    requestId: "req_update_optional_fields",
    actor: { type: "user", id: "owner_1" },
  });

  const created = await new core.CreateOrganizationUseCase(appContext).execute(owner, {
    ownerUserId: "owner_1",
    name: "Role based org",
  });
  assert.equal(created.ok, true);

  const updated = await new core.UpdateOrganizationUseCase(appContext).execute(owner, {
    organizationId: created.data.id,
    name: "Role based org updated",
    subdomain: "new-subdomain",
    url: "https://new.example.com",
    metadata: { feature: "enabled" },
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "manager", permissions: ["billing:plans:read"] }],
    },
  });

  assert.equal(updated.ok, true);
  assert.equal(updated.data.subdomain, "new-subdomain");
  assert.equal(updated.data.url, "https://new.example.com");
  assert.deepEqual(updated.data.metadata, { feature: "enabled" });
  assert.equal(updated.data.roleConfig.employeeRoles[0].name, "manager");
});

test("DisableOrganizationUseCase keeps optional fields when they are present", async () => {
  const { core, appContext } = await createAppContext();
  const owner = core.ExecutionContext.create({
    requestId: "req_disable_with_optional_fields",
    actor: { type: "user", id: "owner_1" },
  });

  const created = await new core.CreateOrganizationUseCase(appContext).execute(owner, {
    ownerUserId: "owner_1",
    name: "Has optional fields",
    subdomain: "tenant-opt",
    url: "https://tenant-opt.example.com",
    metadata: { source: "manual" },
  });
  assert.equal(created.ok, true);

  const disabled = await new core.DisableOrganizationUseCase(appContext).execute(owner, {
    organizationId: created.data.id,
  });

  assert.equal(disabled.ok, true);
  assert.equal(disabled.data.status, "disabled");
  assert.equal(disabled.data.subdomain, "tenant-opt");
  assert.equal(disabled.data.url, "https://tenant-opt.example.com");
  assert.deepEqual(disabled.data.metadata, { source: "manual" });
});

test("plan CRUD enforces permissions and uses inactive status as soft delete", async () => {
  const { core, appContext, state } = await createAppContext();
  const admin = core.ExecutionContext.create({
    requestId: "req_plan_admin",
    actor: { type: "system" },
    permissions: ["billing:plans:read", "billing:plans:write"],
  });
  const denied = core.ExecutionContext.create({
    requestId: "req_plan_denied",
    actor: { type: "user", id: "user_1" },
  });
  const created = await new core.CreatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    code: "complete",
    name: "Complete",
    amountCents: 1000,
    interval: "monthly",
    features: ["3 consultas"],
  });
  assert.equal(created.ok, true);
  const otherTenant = await new core.CreatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_2",
    code: "complete",
    name: "Other tenant plan",
    amountCents: 2000,
    interval: "monthly",
  });
  assert.equal(otherTenant.ok, true);

  const read = await new core.GetPlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: created.data.plan.id,
  });
  const listed = await new core.ListPlansUseCase(appContext).execute(admin, {
    organizationId: "org_1",
  });
  const crossTenantRead = await new core.GetPlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: otherTenant.data.plan.id,
  });
  const updated = await new core.UpdatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: created.data.plan.id,
    name: "Complete Plus",
    amountCents: 1500,
    features: ["3 consultas", "2 exames"],
  });
  const disabled = await new core.DisablePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: created.data.plan.id,
  });
  const forbidden = await new core.GetPlanUseCase(appContext).execute(denied, {
    organizationId: "org_1",
    planId: created.data.plan.id,
  });

  assert.equal(read.ok, true);
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 1);
  assert.equal(crossTenantRead.ok, false);
  assert.equal(crossTenantRead.error.code, "plan.not_found");
  assert.equal(updated.ok, true);
  assert.equal(updated.data.name, "Complete Plus");
  assert.deepEqual(updated.data.features, ["3 consultas", "2 exames"]);
  assert.equal(disabled.ok, true);
  assert.equal(disabled.data.status, "inactive");
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.error.kind, "authorization");
  assert.equal(state.plans.size, 2);
});

test("plan use cases return validation and not found failures for invalid plan projections", async () => {
  const { core, appContext, state } = await createAppContext();
  const admin = core.ExecutionContext.create({
    requestId: "req_plan_edges",
    actor: { type: "system" },
    permissions: ["billing:plans:read", "billing:plans:write"],
  });
  const denied = core.ExecutionContext.create({
    requestId: "req_plan_remove_denied",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const invalidCreate = await new core.CreatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    code: "invalid",
    name: "Invalid",
    amountCents: 0,
    interval: "monthly",
  });
  assert.equal(invalidCreate.ok, false);
  assert.equal(invalidCreate.error.code, "plan.price.amountCents.invalid");

  const missingUpdate = await new core.UpdatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: "missing_plan",
    name: "Missing",
  });
  const missingDisable = await new core.DisablePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: "missing_plan",
  });
  assert.equal(missingUpdate.ok, false);
  assert.equal(missingUpdate.error.code, "plan.not_found");
  assert.equal(missingDisable.ok, false);
  assert.equal(missingDisable.error.code, "plan.not_found");

  const forbiddenDisable = await new core.DisablePlanUseCase(appContext).execute(denied, {
    organizationId: "org_1",
    planId: "missing_plan",
  });
  assert.equal(forbiddenDisable.ok, false);
  assert.equal(forbiddenDisable.error.kind, "authorization");

  state.plans.set(
    "",
    Object.freeze({
      id: "",
      organizationId: "org_1",
      code: "broken",
      name: "Broken",
      price: Object.freeze({ amountCents: 1000, currency: "BRL", interval: "monthly" }),
      features: Object.freeze([]),
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
    }),
  );

  const invalidProjectionUpdate = await new core.UpdatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: "",
    name: "Broken updated",
  });
  const invalidProjectionDisable = await new core.DisablePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: "",
  });

  assert.equal(invalidProjectionUpdate.ok, false);
  assert.equal(invalidProjectionUpdate.error.kind, "validation");
  assert.equal(invalidProjectionDisable.ok, false);
  assert.equal(invalidProjectionDisable.error.kind, "validation");
});

test("list and update plan use cases deny actors without billing permissions", async () => {
  const { core, appContext, state } = await createAppContext();
  const plan = core.Plan.create({
    id: "plan_permission_denied",
    organizationId: "org_1",
    code: "starter",
    name: "Starter",
    amountCents: 1000,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(plan.ok, true);
  state.plans.set(plan.data.id, plan.data);

  const denied = core.ExecutionContext.create({
    requestId: "req_plan_permission_denied",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });

  const listed = await new core.ListPlansUseCase(appContext).execute(denied, {
    organizationId: "org_1",
  });
  const updated = await new core.UpdatePlanUseCase(appContext).execute(denied, {
    organizationId: "org_1",
    planId: "plan_permission_denied",
    name: "Blocked",
  });

  assert.equal(listed.ok, false);
  assert.equal(listed.error.kind, "authorization");
  assert.equal(updated.ok, false);
  assert.equal(updated.error.kind, "authorization");
});

test("plan use cases reject tenant scope mismatch before permission checks", async () => {
  const { core, appContext, state } = await createAppContext();
  const plan = core.Plan.create({
    id: "plan_scope_mismatch",
    organizationId: "org_1",
    code: "scope",
    name: "Scope",
    amountCents: 1000,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(plan.ok, true);
  state.plans.set(plan.data.id, plan.data);

  const wrongTenant = core.ExecutionContext.create({
    requestId: "req_plan_scope_mismatch",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_2",
    permissions: ["billing:plans:read", "billing:plans:write"],
  });

  const created = await new core.CreatePlanUseCase(appContext).execute(wrongTenant, {
    organizationId: "org_1",
    code: "blocked",
    name: "Blocked",
    amountCents: 1000,
    interval: "monthly",
  });
  const listed = await new core.ListPlansUseCase(appContext).execute(wrongTenant, {
    organizationId: "org_1",
  });
  const updated = await new core.UpdatePlanUseCase(appContext).execute(wrongTenant, {
    organizationId: "org_1",
    planId: "plan_scope_mismatch",
    name: "Blocked",
  });
  const disabled = await new core.DisablePlanUseCase(appContext).execute(wrongTenant, {
    organizationId: "org_1",
    planId: "plan_scope_mismatch",
  });

  assert.equal(created.ok, false);
  assert.equal(created.error.code, "core.organization_scope_mismatch");
  assert.equal(listed.ok, false);
  assert.equal(listed.error.code, "core.organization_scope_mismatch");
  assert.equal(updated.ok, false);
  assert.equal(updated.error.code, "core.organization_scope_mismatch");
  assert.equal(disabled.ok, false);
  assert.equal(disabled.error.code, "core.organization_scope_mismatch");
});

test("UpdatePlanUseCase preserves current fields and clears metadata when null", async () => {
  const { core, appContext, state } = await createAppContext();
  const admin = core.ExecutionContext.create({
    requestId: "req_update_plan_metadata_clear",
    actor: { type: "system" },
    permissions: ["billing:plans:write"],
  });
  const plan = core.Plan.create({
    id: "plan_metadata_clear",
    organizationId: "org_1",
    code: "clear-meta",
    name: "Clear Meta",
    amountCents: 1200,
    interval: "monthly",
    features: ["feature-a"],
    metadata: { source: "seed" },
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(plan.ok, true);
  state.plans.set(plan.data.id, plan.data);

  const result = await new core.UpdatePlanUseCase(appContext).execute(admin, {
    organizationId: "org_1",
    planId: "plan_metadata_clear",
    interval: "yearly",
    metadata: null,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Clear Meta");
  assert.equal(result.data.price.amountCents, 1200);
  assert.equal(result.data.price.interval, "yearly");
  assert.deepEqual(result.data.features, ["feature-a"]);
  assert.equal(result.data.metadata, undefined);
});

test("CreatePlanUseCase propagates billing and audit event factory validation failures", async () => {
  const { core, appContext, state } = await createAppContext();
  const admin = core.ExecutionContext.create({
    requestId: "req_plan_event_failures",
    actor: { type: "system" },
    permissions: ["billing:plans:write"],
  });

  let calls = 0;
  const billingEventFailureContext = {
    ...appContext,
    idGenerator: {
      newId: () => {
        calls += 1;
        return calls === 2 ? "" : `custom_${calls}`;
      },
    },
  };

  const billingEventFailure = await new core.CreatePlanUseCase(billingEventFailureContext).execute(
    admin,
    {
      organizationId: "org_1",
      code: "billing-failure",
      name: "Billing failure",
      amountCents: 1000,
      interval: "monthly",
    },
  );

  assert.equal(billingEventFailure.ok, false);
  assert.equal(billingEventFailure.error.kind, "validation");
  assert.equal(state.plans.size, 0);

  calls = 0;
  const auditEventFailureContext = {
    ...appContext,
    idGenerator: {
      newId: () => {
        calls += 1;
        return calls === 3 ? "" : `custom_audit_${calls}`;
      },
    },
  };

  const auditEventFailure = await new core.CreatePlanUseCase(auditEventFailureContext).execute(
    admin,
    {
      organizationId: "org_1",
      code: "audit-failure",
      name: "Audit failure",
      amountCents: 1000,
      interval: "monthly",
    },
  );

  assert.equal(auditEventFailure.ok, false);
  assert.equal(auditEventFailure.error.kind, "validation");
  assert.equal(state.plans.size, 0);
});

test("subscription CRUD is tenant scoped, updates ownership and cancels externally", async () => {
  const { core, appContext, state } = await createAppContext();
  const subscription = core.Subscription.create({
    id: "sub_crud",
    organizationId: "org_1",
    userId: "user_1",
    customerId: "customer_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerSubscriptionId: "provider_sub_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: { source: "initial" },
  });
  assert.equal(subscription.ok, true);
  state.subscriptions.set(subscription.data.id, subscription.data);
  const tenant = core.ExecutionContext.create({
    requestId: "req_subscription_crud",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_1",
  });
  const wrongTenant = core.ExecutionContext.create({
    requestId: "req_wrong_tenant",
    actor: { type: "user", id: "user_1" },
    organizationId: "org_2",
  });

  const read = await new core.GetSubscriptionUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    subscriptionId: "sub_crud",
  });
  const listed = await new core.ListSubscriptionsUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
  });
  const updated = await new core.UpdateSubscriptionUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    subscriptionId: "sub_crud",
    userId: "user_2",
    metadata: { source: "updated", items: [1, 2] },
  });
  const denied = await new core.GetSubscriptionUseCase(appContext).execute(wrongTenant, {
    organizationId: "org_1",
    subscriptionId: "sub_crud",
  });
  const canceled = await new core.CancelSubscriptionUseCase(appContext).execute(tenant, {
    organizationId: "org_1",
    subscriptionId: "sub_crud",
  });

  assert.equal(read.ok, true);
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 1);
  assert.equal(updated.ok, true);
  assert.equal(updated.data.userId, "user_2");
  assert.deepEqual(updated.data.metadata, { source: "updated", items: [1, 2] });
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "core.organization_scope_mismatch");
  assert.equal(canceled.ok, true);
  assert.equal(canceled.data.status, "canceled");
  assert.equal(state.providerRequests.at(-1).subscription.id, "sub_crud");
  assert.equal(state.subscriptions.size, 1);
});
