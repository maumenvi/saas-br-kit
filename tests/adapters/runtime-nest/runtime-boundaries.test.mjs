import assert from "node:assert/strict";
import test from "node:test";
import { createPlanInputSchema } from "#contracts";
import { CoreBuildError, clock, idGenerator, logger, ok, SaasBrCore } from "#core";
import "reflect-metadata";
import {
  ActorsChangePasswordController,
  ActorsCreateAccountController,
  ActorsCreateController,
  ActorsDisableController,
  ActorsForgotPasswordController,
  ActorsGetController,
  ActorsListController,
  ActorsLoginController,
  ActorsRefreshTokenController,
  ActorsResetPasswordController,
  ActorsUpdateController,
  ChangeActorPasswordBodyDto,
  ChangeOrganizationActorRoleBodyDto,
  CreateAccountBodyDto,
  CreateActorBodyDto,
  CreateCustomerBodyDto,
  CreateInvitedOrganizationActorBodyDto,
  CreateOrganizationBodyDto,
  CreatePlanBodyDto,
  CreateSubscriptionBodyDto,
  CustomersCreateController,
  CustomersDisableController,
  CustomersGetController,
  CustomersListController,
  CustomersUpdateController,
  ForgotPasswordBodyDto,
  HealthController,
  InMemoryOidcTransactionStore,
  InvitationTokenError,
  InvitationTokenService,
  InviteOrganizationActorBodyDto,
  LoginActorBodyDto,
  MembershipsAcceptController,
  MembershipsAcceptPublicInvitationController,
  MembershipsChangeRoleController,
  MembershipsCreateInvitedActorController,
  MembershipsDisableController,
  MembershipsInviteController,
  MembershipsListController,
  MembershipsResendInvitationController,
  NestContractValidation,
  NestExecutionContextFactory,
  NestHttpErrorMapper,
  nestCoreAdapter,
  OidcCallbackController,
  OidcLinkStartController,
  OidcLoginStartController,
  OidcProviderRegistry,
  OidcRuntime,
  OrganizationsCreateController,
  OrganizationsDisableController,
  OrganizationsGetController,
  OrganizationsListController,
  OrganizationsUpdateController,
  PaymentWebhooksProcessController,
  PaymentWebhooksReceiveController,
  PlansCreateController,
  PlansDisableController,
  PlansGetController,
  PlansListController,
  PlansUpdateController,
  ReceivePaymentWebhookBodyDto,
  RefreshActorTokenBodyDto,
  ResetPasswordBodyDto,
  SAAS_BR_NEST_OPTIONS,
  SaasBrModule,
  SubscriptionsCancelController,
  SubscriptionsCreateController,
  SubscriptionsGetController,
  SubscriptionsListController,
  SubscriptionsUpdateController,
  safeMetadataApiProperty,
  UpdateActorBodyDto,
  UpdateCustomerBodyDto,
  UpdateOrganizationBodyDto,
  UpdatePlanBodyDto,
  UpdateSubscriptionBodyDto,
} from "../../../dist/adapters/runtime-nest/index.js";

test("Nest Core adapter declares every runtime dependency before module creation", async () => {
  const fixedClock = Object.freeze({
    now: () => new Date("2026-06-30T12:00:00.000Z"),
  });
  const sequentialIdGenerator = Object.freeze({
    newId: (() => {
      let nextId = 1;
      return () => {
        const id = `nest_${nextId}`;
        nextId += 1;
        return id;
      };
    })(),
  });
  const noopLogger = Object.freeze({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  });

  const core = SaasBrCore.create()
    .add(clock(fixedClock))
    .add(logger(noopLogger))
    .add(idGenerator(sequentialIdGenerator))
    .adapters.add(nestCoreAdapter());

  await assert.rejects(
    () => core.build(),
    (error) =>
      error instanceof CoreBuildError &&
      error.message.includes("core.transaction-manager") &&
      error.message.includes('registration "nest"'),
  );
});

test("OIDC registry and transaction store reject duplicates, expiration and replay", async () => {
  const provider = {
    id: "google",
    issuer: "https://accounts.google.com",
    createAuthorizationUrl: async () => ok("https://accounts.google.com/authorize"),
    exchangeAuthorizationCode: async () =>
      ok({
        providerId: "google",
        issuer: "https://accounts.google.com",
        subject: "subject_1",
      }),
  };
  const registry = new OidcProviderRegistry([provider]);
  const store = new InMemoryOidcTransactionStore();
  const transaction = Object.freeze({
    providerId: "google",
    flow: "login",
    state: "state_1",
    nonce: "nonce_1",
    codeVerifier: "verifier_1",
    redirectUri: "https://api.example.com/auth/oidc/google/callback",
    expiresAt: "2026-06-30T12:10:00.000Z",
  });

  assert.equal(registry.get("google"), provider);
  assert.throws(() => new OidcProviderRegistry([provider, provider]));
  await store.save(transaction);
  assert.deepEqual(
    await store.consume("state_1", new Date("2026-06-30T12:09:00.000Z")),
    transaction,
  );
  assert.equal(await store.consume("state_1", new Date("2026-06-30T12:09:00.000Z")), null);
  await store.save(transaction);
  assert.equal(await store.consume("state_1", new Date("2026-06-30T12:10:00.000Z")), null);
});

test("OIDC runtime correlates a trusted callback and rejects state replay", async () => {
  let authorizationInput;
  let callbackInput;
  const provider = {
    id: "google",
    issuer: "https://accounts.google.com",
    createAuthorizationUrl: async (input) => {
      authorizationInput = input;
      return ok(`https://accounts.google.com/authorize?state=${input.state}`);
    },
    exchangeAuthorizationCode: async (input) => {
      callbackInput = input;
      return ok({
        providerId: "google",
        issuer: "https://accounts.google.com",
        subject: "subject_1",
        email: "user@example.com",
        emailVerified: true,
      });
    },
  };
  const runtime = new OidcRuntime({
    appContext: {
      clock: { now: () => new Date("2026-06-30T12:00:00.000Z") },
    },
    oidc: {
      providers: [provider],
      publicBaseUrl: "https://api.example.com",
    },
  });

  const started = await runtime.start("google", "login");
  assert.equal(started.ok, true);
  assert.equal(authorizationInput.redirectUri, "https://api.example.com/auth/oidc/google/callback");
  const completed = await runtime.complete("google", {
    state: authorizationInput.state,
    code: "authorization_code_1",
  });
  assert.equal(completed.ok, true);
  assert.equal(callbackInput.expectedNonce, authorizationInput.nonce);
  assert.equal(new URL(callbackInput.callbackUrl).searchParams.get("code"), "authorization_code_1");
  const replay = await runtime.complete("google", {
    state: authorizationInput.state,
    code: "authorization_code_1",
  });
  assert.equal(replay.ok, false);
  assert.equal(replay.error.code, "oidc.transaction_invalid");
});

test("OIDC runtime rejects identity coordinates outside the configured provider", async () => {
  let authorizationInput;
  const runtime = new OidcRuntime({
    appContext: {
      clock: { now: () => new Date("2026-06-30T12:00:00.000Z") },
    },
    oidc: {
      providers: [
        {
          id: "google",
          issuer: "https://accounts.google.com",
          createAuthorizationUrl: async (input) => {
            authorizationInput = input;
            return ok("https://accounts.google.com/authorize");
          },
          exchangeAuthorizationCode: async () =>
            ok({
              providerId: "other-provider",
              issuer: "https://issuer.example.com",
              subject: "subject_1",
            }),
        },
      ],
      publicBaseUrl: "https://api.example.com",
    },
  });

  assert.equal((await runtime.start("google", "login")).ok, true);
  const completed = await runtime.complete("google", {
    state: authorizationInput.state,
    code: "authorization_code_1",
  });
  assert.equal(completed.ok, false);
  assert.equal(completed.error.code, "oidc.provider_identity_mismatch");
});

test("invitation tokens are bound to actor, organization and a 24 hour window", () => {
  const service = new InvitationTokenService("a".repeat(32), 24 * 60 * 60 * 1_000);
  const invitation = service.issue({
    userId: "actor_2",
    organizationId: "org_1",
    issuedAt: new Date("2026-06-30T12:00:00.000Z"),
  });

  assert.equal(invitation.expiresAt, "2026-07-01T12:00:00.000Z");
  assert.deepEqual(service.verify(invitation.token, new Date("2026-07-01T11:59:59.000Z")), {
    userId: "actor_2",
    organizationId: "org_1",
    issuedAt: "2026-06-30T12:00:00.000Z",
    expiresAt: "2026-07-01T12:00:00.000Z",
  });
  assert.throws(
    () => service.verify(invitation.token, new Date("2026-07-01T12:00:00.000Z")),
    (error) => error instanceof InvitationTokenError && error.code === "invitation.token_expired",
  );
  assert.throws(
    () => service.verify(`${invitation.token}modified`, new Date("2026-06-30T12:01:00.000Z")),
    (error) => error instanceof InvitationTokenError && error.code === "invitation.token_invalid",
  );
});

test("execution context factory trusts guard identity and ignores authorization headers", () => {
  const factory = new NestExecutionContextFactory();
  const context = factory.create(
    {
      headers: {
        "X-Request-ID": ["req_1", "ignored"],
        "x-actor-id": "spoofed_actor",
        "X-Organization-Id": "spoofed_org",
        "x-permissions": "*",
      },
      user: {
        userId: "actor_1",
        organizationId: "org_1",
        permissions: ["plans:read", "plans:write"],
      },
    },
    { actorId: "fallback_actor", organizationId: "fallback_org" },
  );

  assert.equal(context.requestId, "req_1");
  assert.deepEqual(context.actor, { type: "user", id: "actor_1" });
  assert.equal(context.organizationId, "org_1");
  assert.deepEqual(context.permissions, ["plans:read", "plans:write"]);
});

test("execution context factory does not create identity from client headers", () => {
  const context = new NestExecutionContextFactory().create({
    headers: {
      "x-request-id": "req_spoofed",
      "x-actor-id": "spoofed_actor",
      "x-organization-id": "spoofed_org",
      "x-permissions": "*",
    },
  });

  assert.equal(context.requestId, "req_spoofed");
  assert.deepEqual(context.actor, { type: "system" });
  assert.equal(context.organizationId, undefined);
  assert.deepEqual(context.permissions, []);
});

test("execution context factory does not mix authenticated identity with fallbacks", () => {
  const context = new NestExecutionContextFactory().create(
    {
      user: {
        userId: "actor_1",
        permissions: [],
      },
    },
    {
      actorId: "fallback_actor",
      organizationId: "fallback_org",
      permissions: ["fallback:read"],
    },
  );

  assert.deepEqual(context.actor, { type: "user", id: "actor_1" });
  assert.equal(context.organizationId, undefined);
  assert.deepEqual(context.permissions, []);
});

test("execution context factory applies fallbacks and defaults to a system actor", () => {
  const factory = new NestExecutionContextFactory();
  const fallback = factory.create(undefined, {
    actorId: "fallback_actor",
    organizationId: "fallback_org",
    permissions: ["fallback:read"],
  });
  const system = factory.create({ headers: { "x-request-id": "req_system" } });

  assert.deepEqual(fallback.actor, { type: "user", id: "fallback_actor" });
  assert.equal(fallback.organizationId, "fallback_org");
  assert.deepEqual(fallback.permissions, ["fallback:read"]);
  assert.equal(system.requestId, "req_system");
  assert.deepEqual(system.actor, { type: "system" });
});

test("HTTP error mapper unwraps success and maps every Core error category", () => {
  const mapper = new NestHttpErrorMapper();
  assert.deepEqual(mapper.unwrap({ ok: true, data: { id: "value" } }), { id: "value" });
  const statuses = {
    validation: 400,
    domain: 400,
    authorization: 403,
    not_found: 404,
    conflict: 409,
    external: 503,
    infrastructure: 503,
  };

  for (const [kind, expectedStatus] of Object.entries(statuses)) {
    const exception = mapper.toException({
      kind,
      code: `test.${kind}`,
      message: "Mapped failure",
      details: { field: "value" },
    });
    assert.equal(exception.getStatus(), expectedStatus);
    assert.deepEqual(exception.getResponse(), {
      error: {
        kind,
        code: `test.${kind}`,
        message: "Mapped failure",
        details: { field: "value" },
      },
    });
  }
});

test("contract validation accepts recursive JSON metadata and normalizes invalid bodies", () => {
  const validation = new NestContractValidation();
  const valid = validation.parse(createPlanInputSchema, {
    organizationId: "org_1",
    code: "starter",
    name: "Starter",
    amountCents: 9900,
    interval: "monthly",
    features: ["3 consultas por mês", "2 exames por mês"],
    metadata: {
      tags: ["premium", { priority: 1 }],
      preferences: { reminders: true, empty: null },
    },
  });

  assert.deepEqual(valid.metadata, {
    tags: ["premium", { priority: 1 }],
    preferences: { reminders: true, empty: null },
  });
  assert.throws(
    () =>
      validation.parse(createPlanInputSchema, {
        code: "",
        name: "Invalid",
        amountCents: -1,
        interval: "weekly",
      }),
    (error) => {
      assert.equal(error.getStatus(), 400);
      assert.equal(error.getResponse().error.code, "request.body_invalid");
      assert.ok(error.getResponse().error.issues.length > 0);
      return true;
    },
  );
});

test("metadata OpenAPI property describes nested objects and arrays", () => {
  assert.equal(safeMetadataApiProperty.type, "object");
  assert.equal(safeMetadataApiProperty.additionalProperties, true);
  assert.deepEqual(safeMetadataApiProperty.example.tags, ["premium", "beta"]);
  assert.deepEqual(safeMetadataApiProperty.example.preferences, {
    notifications: true,
    locale: "pt-BR",
  });
});

test("health controller includes database health only when the adapter returns it", async () => {
  const healthy = new HealthController({
    appContext: {
      adapters: {
        database: { healthCheck: async () => ({ status: "up", latencyMs: 2 }) },
      },
    },
  });
  const basic = new HealthController({ appContext: { adapters: {} } });

  assert.deepEqual(await healthy.getHealth(), {
    status: "up",
    database: { status: "up", latencyMs: 2 },
  });
  assert.deepEqual(await basic.getHealth(), { status: "up" });
});

test("SaasBrModule registers all controllers with static and async options", () => {
  const options = { appContext: { adapters: {} } };
  const staticModule = SaasBrModule.forRoot(options);
  const asyncModule = SaasBrModule.forRootAsync({
    imports: ["dependency"],
    inject: ["token"],
    useFactory: () => options,
  });

  assert.equal(staticModule.controllers.length, 46);
  assert.deepEqual(
    staticModule.providers.find((provider) => provider.provide === SAAS_BR_NEST_OPTIONS),
    { provide: SAAS_BR_NEST_OPTIONS, useValue: options },
  );
  assert.deepEqual(asyncModule.imports, ["dependency"]);
  const provider = asyncModule.providers.find(
    (candidate) => candidate.provide === SAAS_BR_NEST_OPTIONS,
  );
  assert.deepEqual(provider.inject, ["token"]);
  assert.equal(provider.useFactory(), options);
});

test("controllers expose complete lifecycle methods without destructive delete routes", () => {
  const expectedMethods = [
    [ActorsChangePasswordController, "changePassword"],
    [ActorsCreateAccountController, "createAccount"],
    [ActorsCreateController, "create"],
    [ActorsDisableController, "disable"],
    [ActorsForgotPasswordController, "forgotPassword"],
    [ActorsGetController, "get"],
    [ActorsListController, "list"],
    [ActorsLoginController, "login"],
    [ActorsRefreshTokenController, "refresh"],
    [ActorsResetPasswordController, "resetPassword"],
    [ActorsUpdateController, "update"],
    [CustomersCreateController, "create"],
    [CustomersDisableController, "disable"],
    [CustomersGetController, "get"],
    [CustomersListController, "list"],
    [CustomersUpdateController, "update"],
    [HealthController, "getHealth"],
    [MembershipsAcceptController, "accept"],
    [MembershipsAcceptPublicInvitationController, "accept"],
    [MembershipsChangeRoleController, "changeRole"],
    [MembershipsCreateInvitedActorController, "createInvitedActor"],
    [MembershipsDisableController, "disable"],
    [MembershipsInviteController, "invite"],
    [MembershipsListController, "list"],
    [MembershipsResendInvitationController, "resend"],
    [OrganizationsCreateController, "create"],
    [OrganizationsDisableController, "disable"],
    [OrganizationsGetController, "get"],
    [OrganizationsListController, "list"],
    [OrganizationsUpdateController, "update"],
    [OidcCallbackController, "callback"],
    [OidcLinkStartController, "start"],
    [OidcLoginStartController, "start"],
    [PaymentWebhooksProcessController, "process"],
    [PaymentWebhooksReceiveController, "receive"],
    [PlansCreateController, "create"],
    [PlansDisableController, "disable"],
    [PlansGetController, "get"],
    [PlansListController, "list"],
    [PlansUpdateController, "update"],
    [SubscriptionsCancelController, "cancel"],
    [SubscriptionsCreateController, "create"],
    [SubscriptionsGetController, "get"],
    [SubscriptionsListController, "list"],
    [SubscriptionsUpdateController, "update"],
  ];

  for (const [Controller, method] of expectedMethods) {
    assert.equal(typeof Controller.prototype[method], "function", `${Controller.name}.${method}`);
    assert.equal("delete" in Controller.prototype, false);
    assert.equal("remove" in Controller.prototype, false);
  }
});

test("controllers keep runtime body DTO metadata for Swagger request bodies", () => {
  const expectedBodies = [
    [ActorsChangePasswordController, "changePassword", 1, ChangeActorPasswordBodyDto],
    [ActorsCreateAccountController, "createAccount", 0, CreateAccountBodyDto],
    [ActorsCreateController, "create", 0, CreateActorBodyDto],
    [ActorsForgotPasswordController, "forgotPassword", 0, ForgotPasswordBodyDto],
    [ActorsLoginController, "login", 0, LoginActorBodyDto],
    [ActorsRefreshTokenController, "refresh", 0, RefreshActorTokenBodyDto],
    [ActorsResetPasswordController, "resetPassword", 0, ResetPasswordBodyDto],
    [ActorsUpdateController, "update", 1, UpdateActorBodyDto],
    [CustomersCreateController, "create", 0, CreateCustomerBodyDto],
    [CustomersUpdateController, "update", 1, UpdateCustomerBodyDto],
    [OrganizationsCreateController, "create", 0, CreateOrganizationBodyDto],
    [OrganizationsUpdateController, "update", 1, UpdateOrganizationBodyDto],
    [PlansCreateController, "create", 0, CreatePlanBodyDto],
    [PlansUpdateController, "update", 1, UpdatePlanBodyDto],
    [SubscriptionsCreateController, "create", 0, CreateSubscriptionBodyDto],
    [SubscriptionsUpdateController, "update", 1, UpdateSubscriptionBodyDto],
    [MembershipsInviteController, "invite", 1, InviteOrganizationActorBodyDto],
    [
      MembershipsCreateInvitedActorController,
      "createInvitedActor",
      1,
      CreateInvitedOrganizationActorBodyDto,
    ],
    [MembershipsChangeRoleController, "changeRole", 2, ChangeOrganizationActorRoleBodyDto],
    [PaymentWebhooksReceiveController, "receive", 1, ReceivePaymentWebhookBodyDto],
  ];

  for (const [Controller, methodName, bodyIndex, expectedDto] of expectedBodies) {
    const paramTypes = Reflect.getMetadata("design:paramtypes", Controller.prototype, methodName);
    assert.ok(Array.isArray(paramTypes), `${Controller.name}.${methodName} metadata missing`);
    assert.equal(paramTypes[bodyIndex], expectedDto, `${Controller.name}.${methodName}`);
  }
});
