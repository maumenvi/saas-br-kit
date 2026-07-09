import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));

test("Organization.create creates immutable active organization", async () => {
  const { Organization } = await loadCore();

  const result = Organization.create({
    id: "org_1",
    ownerUserId: "user_1",
    name: "  Minha empresa  ",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: {
      source: "self-service",
      seats: 10,
      migrated: false,
      legacyId: null,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Minha empresa");
  assert.equal(result.data.status, "active");
  assert.equal(result.data.updatedAt, "2026-06-18T12:00:00.000Z");
  assert.deepEqual(result.data.metadata, {
    source: "self-service",
    seats: 10,
    migrated: false,
    legacyId: null,
  });
  assert.equal(Object.isFrozen(result.data), true);
  assert.equal(Object.isFrozen(result.data.metadata), true);
});

test("Organization.create supports URL, subdomain and configurable employee roles", async () => {
  const { Organization } = await loadCore();
  const result = Organization.create({
    id: "org_roles",
    ownerUserId: "owner_1",
    name: "Role organization",
    subdomain: "My-Store",
    url: "https://my-store.example.com/login",
    roleConfig: {
      ownerRoleName: "proprietario",
      employeeRoles: [
        { name: "admin", permissions: ["orders:read", "orders:write", "orders:read"] },
        { name: "manager", permissions: ["reports:read"] },
      ],
    },
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.subdomain, "my-store");
  assert.equal(result.data.url, "https://my-store.example.com/login");
  assert.deepEqual(result.data.roleConfig, {
    ownerRoleName: "proprietario",
    employeeRoles: [
      { name: "admin", permissions: ["orders:read", "orders:write"] },
      { name: "manager", permissions: ["reports:read"] },
    ],
  });
  assert.equal(Object.isFrozen(result.data.roleConfig.employeeRoles), true);
  assert.equal(Object.isFrozen(result.data.roleConfig.employeeRoles[0].permissions), true);
});

test("Organization.create rejects invalid tenancy and role configuration", async () => {
  const { Organization } = await loadCore();
  const base = {
    id: "org_invalid",
    ownerUserId: "owner_1",
    name: "Invalid organization",
    createdAt: "2026-06-18T12:00:00.000Z",
  };
  const invalidSubdomain = Organization.create({ ...base, subdomain: "-invalid" });
  const invalidUrl = Organization.create({ ...base, url: "ftp://example.com" });
  const duplicateRole = Organization.create({
    ...base,
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "OWNER", permissions: [] }],
    },
  });
  const actorPermission = Organization.create({
    ...base,
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "admin", permissions: ["actors:write"] }],
    },
  });

  assert.equal(invalidSubdomain.ok, false);
  assert.equal(invalidSubdomain.error.code, "organization.subdomain.invalid");
  assert.equal(invalidUrl.ok, false);
  assert.equal(invalidUrl.error.code, "organization.url.invalid");
  assert.equal(duplicateRole.ok, false);
  assert.equal(duplicateRole.error.code, "organization.roleConfig.role_duplicate");
  assert.equal(actorPermission.ok, false);
  assert.equal(actorPermission.error.code, "organization.roleConfig.employee_actor_permission");
});

test("Organization.create validates empty employee roles and invalid role names while trimming permissions", async () => {
  const { Organization } = await loadCore();
  const base = {
    id: "org_more_invalid",
    ownerUserId: "owner_1",
    name: "Role validation org",
    createdAt: "2026-06-18T12:00:00.000Z",
  };

  const emptyEmployeeRoles = Organization.create({
    ...base,
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [],
    },
  });
  const invalidEmployeeRoleName = Organization.create({
    ...base,
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "   ", permissions: ["reports:read"] }],
    },
  });
  const normalizedPermissions = Organization.create({
    ...base,
    roleConfig: {
      ownerRoleName: "owner",
      employeeRoles: [
        { name: "analyst", permissions: [" reports:read ", "", "reports:read", " "] },
      ],
    },
  });

  assert.equal(emptyEmployeeRoles.ok, false);
  assert.equal(emptyEmployeeRoles.error.code, "organization.roleConfig.employeeRoles.empty");
  assert.equal(invalidEmployeeRoleName.ok, false);
  assert.equal(
    invalidEmployeeRoleName.error.code,
    "organization.roleConfig.employeeRole.name.invalid",
  );
  assert.equal(normalizedPermissions.ok, true);
  assert.deepEqual(normalizedPermissions.data.roleConfig.employeeRoles, [
    { name: "analyst", permissions: ["reports:read"] },
  ]);
});

test("Customer.create normalizes organization-scoped customer data", async () => {
  const { Customer } = await loadCore();
  const result = Customer.create({
    id: "customer_1",
    organizationId: "org_1",
    name: " Customer One ",
    email: " CUSTOMER@EXAMPLE.COM ",
    document: " 123456789 ",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata: { preferences: { locale: "pt-BR" }, tags: ["vip", { score: 10 }] },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Customer One");
  assert.equal(result.data.email, "customer@example.com");
  assert.equal(result.data.document, "123456789");
  assert.equal(Object.isFrozen(result.data.metadata.preferences), true);
  assert.equal(Object.isFrozen(result.data.metadata.tags), true);
  assert.equal(Object.isFrozen(result.data.metadata.tags[1]), true);
});

test("metadata is recursively cloned so caller mutations cannot change entities", async () => {
  const { Plan } = await loadCore();
  const metadata = {
    nested: { enabled: true },
    items: [{ quantity: 1 }, ["nested", { value: 2 }]],
  };
  const result = Plan.create({
    id: "plan_metadata",
    organizationId: "org_1",
    code: "metadata",
    name: "Metadata",
    amountCents: 1000,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
    metadata,
  });
  assert.equal(result.ok, true);
  metadata.nested.enabled = false;
  metadata.items[0].quantity = 99;

  assert.equal(result.data.metadata.nested.enabled, true);
  assert.equal(result.data.metadata.items[0].quantity, 1);
  assert.equal(Object.isFrozen(result.data.metadata.items), true);
  assert.equal(Object.isFrozen(result.data.metadata.items[1]), true);
});

test("Plan.create rejects invalid prices and normalizes codes", async () => {
  const { Plan } = await loadCore();

  const invalid = Plan.create({
    id: "plan_1",
    organizationId: "org_1",
    code: "starter",
    name: "Starter",
    amountCents: 0,
    interval: "monthly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.kind, "validation");
  assert.equal(invalid.error.code, "plan.price.amountCents.invalid");

  const valid = Plan.create({
    id: "plan_2",
    organizationId: "org_1",
    code: " PRO ",
    name: "Pro",
    amountCents: 9900,
    interval: "yearly",
    features: ["billing", " tenant "],
    metadata: { source: "catalog", featured: true },
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(valid.ok, true);
  assert.equal(valid.data.organizationId, "org_1");
  assert.equal(valid.data.code, "pro");
  assert.deepEqual(valid.data.features, ["billing", "tenant"]);
  assert.deepEqual(valid.data.metadata, { source: "catalog", featured: true });
  assert.equal(Object.isFrozen(valid.data.price), true);
  assert.equal(Object.isFrozen(valid.data.features), true);
  assert.equal(Object.isFrozen(valid.data.metadata), true);
});

test("subscription access policy allows active subscriptions inside the current period", async () => {
  const { Subscription } = await loadCore();

  const subscription = Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    providerCustomerId: "cust_1",
    providerSubscriptionId: "prov_sub_1",
    status: "active",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    metadata: { campaign: "launch", imported: false },
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(subscription.ok, true);
  assert.deepEqual(subscription.data.metadata, { campaign: "launch", imported: false });
  assert.equal(Object.isFrozen(subscription.data.metadata), true);

  const decision = Subscription.decideAccess({
    subscription: subscription.data,
    at: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(decision.ok, true);
  assert.deepEqual(decision.data, {
    allowed: true,
    reason: "subscription_active",
    subscriptionId: "sub_1",
    status: "active",
  });
});

test("subscription access policy denies inactive or expired subscriptions", async () => {
  const { Subscription } = await loadCore();

  const pastDue = Subscription.create({
    id: "sub_1",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "past_due",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(pastDue.ok, true);

  const inactiveDecision = Subscription.decideAccess({
    subscription: pastDue.data,
    at: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(inactiveDecision.ok, true);
  assert.equal(inactiveDecision.data.allowed, false);
  assert.equal(inactiveDecision.data.reason, "subscription_inactive");

  const expired = Subscription.create({
    id: "sub_2",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    currentPeriodStart: "2026-05-01T00:00:00.000Z",
    currentPeriodEnd: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
  });

  assert.equal(expired.ok, true);

  const expiredDecision = Subscription.decideAccess({
    subscription: expired.data,
    at: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(expiredDecision.ok, true);
  assert.equal(expiredDecision.data.allowed, false);
  assert.equal(expiredDecision.data.reason, "subscription_expired");
});

test("BillingEvent.create stores only safe metadata", async () => {
  const { BillingEvent } = await loadCore();

  const result = BillingEvent.create({
    id: "evt_1",
    type: "subscription_created",
    organizationId: "org_1",
    planId: "plan_1",
    subscriptionId: "sub_1",
    occurredAt: "2026-06-18T12:00:00.000Z",
    metadata: {
      provider: "fixture",
      amountCents: 9900,
      trial: false,
      note: null,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.data), true);
  assert.equal(Object.isFrozen(result.data.metadata), true);
  assert.deepEqual(result.data.metadata, {
    provider: "fixture",
    amountCents: 9900,
    trial: false,
    note: null,
  });
});

test("WebhookEvent.create records raw payload and processing status safely", async () => {
  const { WebhookEvent, WebhookEventTransitions } = await loadCore();

  const result = WebhookEvent.create({
    id: "wh_1",
    provider: "fixture",
    providerEventId: "evt_1",
    eventName: "payment.unmapped",
    rawPayload: {
      id: "evt_1",
      secret: "stored-but-not-logged",
    },
    receivedAt: "2026-06-18T12:00:00.000Z",
    metadata: {
      source: "webhook",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.status, "pending");
  assert.equal(result.data.processingAttempts, 0);
  assert.equal(Object.isFrozen(result.data), true);
  assert.equal(Object.isFrozen(result.data.rawPayload), true);

  const processing = WebhookEventTransitions.markProcessing(result.data, {
    attemptedAt: "2026-06-18T12:01:00.000Z",
  });
  assert.equal(processing.ok, true);
  assert.equal(processing.data.status, "processing");
  assert.equal(processing.data.processingAttempts, 1);

  const unknown = WebhookEventTransitions.markUnknown(processing.data, {
    unknownAt: "2026-06-18T12:02:00.000Z",
    reason: "not mapped",
  });
  assert.equal(unknown.ok, true);
  assert.equal(unknown.data.status, "unknown");
  assert.equal(unknown.data.analysisReason, "not mapped");
});

test("AuditEvent.create creates immutable billing audit records", async () => {
  const { AuditEvent } = await loadCore();

  const result = AuditEvent.create({
    id: "audit_1",
    type: "billing.subscription_created",
    occurredAt: "2026-06-18T12:00:00.000Z",
    requestId: "req_1",
    actorType: "user",
    actorId: "user_1",
    organizationId: "org_1",
    entityType: "subscription",
    entityId: "sub_1",
    metadata: {
      provider: "fixture",
      amountCents: 9900,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.type, "billing.subscription_created");
  assert.equal(Object.isFrozen(result.data), true);
  assert.equal(Object.isFrozen(result.data.metadata), true);
});

test("AuditEvent.create rejects unknown audit event types", async () => {
  const { AuditEvent } = await loadCore();

  const result = AuditEvent.create({
    id: "audit_1",
    type: "billing.unknown",
    occurredAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "validation");
  assert.equal(result.error.code, "auditEvent.type.invalid");
});

test("subscription access policy handles missing, not-started and invalid timestamp cases", async () => {
  const { Subscription } = await loadCore();
  const missingDecision = Subscription.decideAccess({
    subscription: null,
    at: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(missingDecision.ok, true);
  assert.equal(missingDecision.data.allowed, false);
  assert.equal(missingDecision.data.reason, "subscription_missing");

  const upcoming = Subscription.create({
    id: "sub_future",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "trialing",
    currentPeriodStart: "2026-07-01T00:00:00.000Z",
    currentPeriodEnd: "2026-08-01T00:00:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(upcoming.ok, true);

  const notStartedDecision = Subscription.decideAccess({
    subscription: upcoming.data,
    at: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(notStartedDecision.ok, true);
  assert.equal(notStartedDecision.data.allowed, false);
  assert.equal(notStartedDecision.data.reason, "subscription_not_started");

  const invalidTimestampDecision = Subscription.decideAccess({
    subscription: upcoming.data,
    at: "invalid-date",
  });
  assert.equal(invalidTimestampDecision.ok, false);
  assert.equal(invalidTimestampDecision.error.code, "subscription.access.at.invalid");
});

test("subscription requireOpen returns expected domain errors and success", async () => {
  const { Subscription } = await loadCore();
  const missing = Subscription.requireOpen(null);
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "subscription.current_missing");

  const closed = Subscription.create({
    id: "sub_closed",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "canceled",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(closed.ok, true);

  const closedResult = Subscription.requireOpen(closed.data);
  assert.equal(closedResult.ok, false);
  assert.equal(closedResult.error.code, "subscription.current_closed");
  assert.deepEqual(closedResult.error.details, {
    subscriptionId: "sub_closed",
    status: "canceled",
  });

  const open = Subscription.create({
    id: "sub_open",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(open.ok, true);

  const openResult = Subscription.requireOpen(open.data);
  assert.equal(openResult.ok, true);
  assert.equal(openResult.data.id, "sub_open");
});

test("refresh token session policies evaluate expiration and validate checkedAt", async () => {
  const { RefreshTokenSessionFactory, RefreshTokenSessionPolicy } = await loadCore();
  const session = RefreshTokenSessionFactory.create({
    id: "refresh_1",
    userId: "user_1",
    familyId: "family_1",
    secretHash: "hash:secret_1",
    expiresAt: "2026-06-18T12:30:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
    deviceId: "browser_1",
  });
  assert.equal(session.ok, true);

  const activeAt = RefreshTokenSessionPolicy.isExpired(session.data, "2026-06-18T12:10:00.000Z");
  const expiredAt = RefreshTokenSessionPolicy.isExpired(session.data, "2026-06-18T12:30:00.000Z");
  const invalidAt = RefreshTokenSessionPolicy.isExpired(session.data, "not-a-date");

  assert.equal(activeAt.ok, true);
  assert.equal(activeAt.data, false);
  assert.equal(expiredAt.ok, true);
  assert.equal(expiredAt.data, true);
  assert.equal(invalidAt.ok, false);
  assert.equal(invalidAt.error.code, "refreshTokenSession.checkedAt.invalid");
});

test("Plan and Subscription domain validations cover interval, period and provider transition branches", async () => {
  const { Plan, Subscription } = await loadCore();

  const invalidPlanInterval = Plan.create({
    id: "plan_invalid_interval",
    organizationId: "org_1",
    code: "growth",
    name: "Growth",
    amountCents: 2500,
    interval: "weekly",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(invalidPlanInterval.ok, false);
  assert.equal(invalidPlanInterval.error.code, "plan.price.interval.invalid");

  const invalidPeriodOrder = Subscription.create({
    id: "sub_invalid_period",
    organizationId: "org_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "active",
    currentPeriodStart: "2026-07-01T00:00:00.000Z",
    currentPeriodEnd: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(invalidPeriodOrder.ok, false);
  assert.equal(invalidPeriodOrder.error.code, "subscription.currentPeriod.invalid");

  const baseSubscription = Subscription.create({
    id: "sub_transition",
    organizationId: "org_1",
    userId: "user_1",
    customerId: "customer_1",
    planId: "plan_1",
    provider: "fixture",
    providerConnectionId: "conn_1",
    status: "pending",
    metadata: { source: "checkout" },
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(baseSubscription.ok, true);

  const invalidProviderCustomer = baseSubscription.data.applyProvider({
    providerCustomerId: "   ",
    providerSubscriptionId: "prov_sub_1",
    status: "active",
    updatedAt: "2026-06-18T12:05:00.000Z",
  });
  assert.equal(invalidProviderCustomer.ok, false);
  assert.equal(invalidProviderCustomer.error.code, "subscription.providerCustomerId.invalid");

  const invalidProviderSubscription = baseSubscription.data.applyProvider({
    providerCustomerId: "prov_customer_1",
    providerSubscriptionId: "   ",
    status: "active",
    updatedAt: "2026-06-18T12:05:00.000Z",
  });
  assert.equal(invalidProviderSubscription.ok, false);
  assert.equal(
    invalidProviderSubscription.error.code,
    "subscription.providerSubscriptionId.invalid",
  );

  const appliedProvider = baseSubscription.data.applyProvider({
    providerCustomerId: "prov_customer_1",
    providerSubscriptionId: "prov_sub_1",
    status: "active",
    currentPeriodStart: "2026-06-18T00:00:00.000Z",
    currentPeriodEnd: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-06-18T12:05:00.000Z",
  });
  assert.equal(appliedProvider.ok, true);

  const webhookUpdated = appliedProvider.data.applyWebhookStatus({
    status: "past_due",
    providerCustomerId: "prov_customer_2",
    providerSubscriptionId: "prov_sub_2",
    currentPeriodStart: "2026-06-20T00:00:00.000Z",
    currentPeriodEnd: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-06-20T12:00:00.000Z",
  });
  assert.equal(webhookUpdated.ok, true);
  assert.equal(webhookUpdated.data.providerCustomerId, "prov_customer_2");
  assert.equal(webhookUpdated.data.providerSubscriptionId, "prov_sub_2");
  assert.equal(webhookUpdated.data.currentPeriodStart, "2026-06-20T00:00:00.000Z");
  assert.equal(webhookUpdated.data.currentPeriodEnd, "2026-07-20T00:00:00.000Z");
  assert.deepEqual(webhookUpdated.data.metadata, { source: "checkout" });

  const providerFailed = appliedProvider.data.markProviderFailure({
    updatedAt: "2026-06-18T12:06:00.000Z",
  });
  assert.equal(providerFailed.ok, true);
  assert.equal(providerFailed.data.status, "incomplete");
});
