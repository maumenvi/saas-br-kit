import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const importCore = () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));
const importContextMerger = () =>
  import(pathToFileURL(path.join(rootDir, "src/core/composition/context-merger.ts")));

const addTechnicalPorts = (core, composer, input = {}) =>
  composer
    .add(
      core.clock(
        input.clock ??
        Object.freeze({
          now: () => new Date("2026-06-18T00:00:00.000Z"),
        }),
      ),
    )
    .add(
      core.idGenerator(
        input.idGenerator ??
        Object.freeze({
          newId: (() => {
            let nextId = 1;
            return () => {
              const id = `test_id_${nextId}`;
              nextId += 1;
              return id;
            };
          })(),
        }),
      ),
    )
    .add(
      core.logger(
        input.logger ??
        Object.freeze({
          debug: () => undefined,
          info: () => undefined,
          warn: () => undefined,
          error: () => undefined,
        }),
      ),
    )
    .add(
      core.transactionManager(
        input.transactionManager ?? {
          runInTransaction: async (operation) => operation(Object.freeze({ id: "test_tx_1" })),
        },
      ),
    );

test("add returns a new immutable composer and build leaves prior instances unchanged", async () => {
  const core = await importCore();
  const { CoreBuildError, SaasBrCore } = core;
  const empty = SaasBrCore.create();
  const configured = addTechnicalPorts(core, empty);

  assert.notEqual(configured, empty);
  assert.equal(Object.isFrozen(empty), true);
  assert.equal(Object.isFrozen(configured), true);
  await assert.rejects(() => empty.build(), CoreBuildError);

  const application = await configured.build();
  assert.equal(Object.isFrozen(application), true);
  assert.equal(Object.isFrozen(application.appContext), true);
  assert.equal(application.outputs.clock, application.appContext.clock);
});

test("builds with technical ports only and reports unconfigured features at use time", async () => {
  const core = await importCore();
  const { CreateOrganizationUseCase, ExecutionContext, SaasBrCore } = core;
  const application = await addTechnicalPorts(core, SaasBrCore.create()).build();

  assert.deepEqual(application.appContext.adapters, {});

  const result = await new CreateOrganizationUseCase(application.appContext).execute(
    ExecutionContext.create({ requestId: "req_unconfigured", actor: { type: "system" } }),
    {
      ownerUserId: "user_1",
      name: "Acme",
    },
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "core.functionality_not_configured");
    assert.equal(result.error.details.functionality, "repositories.organizations");
  }
});

test("build resolves registration dependencies independently of add order", async () => {
  const core = await importCore();
  const { CorePort, CoreRegistration, SaasBrCore } = core;
  const messagePort = new CorePort({
    id: "fixture.message",
    description: "Fixture dependency.",
  });
  const consumer = new CoreRegistration({
    name: "consumer",
    requires: [messagePort],
    install: (registry) => ({
      context: Object.freeze({ message: registry.resolve(messagePort) }),
      output: registry.resolve(messagePort),
    }),
  });
  const provider = new CoreRegistration({
    name: "provider",
    provides: [messagePort],
    install: (registry) => {
      registry.provide(messagePort, "ready");
      return { context: Object.freeze({}), output: "ready" };
    },
  });

  const application = await addTechnicalPorts(core, SaasBrCore.create())
    .add(consumer)
    .add(provider)
    .build();

  assert.equal(application.outputs.consumer, "ready");
  assert.equal(application.appContext.message, "ready");
});

test("composition reports duplicate registrations, duplicate ports and missing dependencies", async () => {
  const core = await importCore();
  const { CoreBuildError, CoreCompositionError, CorePort, CoreRegistration, SaasBrCore } = core;
  const fixturePort = new CorePort({ id: "fixture.unique", description: "Unique fixture." });
  const registration = (name) =>
    new CoreRegistration({
      name,
      provides: [fixturePort],
      install: (registry) => {
        registry.provide(fixturePort, name);
        return { context: Object.freeze({}), output: name };
      },
    });
  const base = addTechnicalPorts(core, SaasBrCore.create());

  assert.throws(() => base.add(registration("same")).add(registration("same")), {
    code: "core.registration_duplicate",
  });
  await assert.rejects(() => base.add(registration("first")).add(registration("second")).build(), {
    code: "core.port_duplicate",
  });

  const missingPort = new CorePort({ id: "fixture.missing", description: "Missing fixture." });
  await assert.rejects(
    () =>
      base
        .add(
          new CoreRegistration({
            name: "blocked",
            requires: [missingPort],
            install: () => ({ context: Object.freeze({}), output: undefined }),
          }),
        )
        .build(),
    (error) =>
      error instanceof CoreBuildError &&
      error.message.includes("fixture.missing") &&
      error.message.includes("blocked"),
  );
  assert.equal(CoreCompositionError.prototype instanceof Error, true);
});

test("each build uses an isolated registry and disposes outputs only once", async () => {
  const core = await importCore();
  const { CoreRegistration, SaasBrCore } = core;
  let installs = 0;
  let disposals = 0;
  const configured = addTechnicalPorts(core, SaasBrCore.create()).add(
    new CoreRegistration({
      name: "lifecycle",
      install: () => {
        installs += 1;
        return {
          context: Object.freeze({}),
          output: installs,
          dispose: () => {
            disposals += 1;
          },
        };
      },
    }),
  );

  const first = await configured.build();
  const second = await configured.build();
  assert.equal(first.outputs.lifecycle, 1);
  assert.equal(second.outputs.lifecycle, 2);
  await first.dispose();
  await first.dispose();
  await second.dispose();
  assert.equal(disposals, 2);
});

test("authProperties registers required auth ports and omits optional branches", async () => {
  const core = await importCore();
  const { SaasBrCore, authProperties } = core;
  const accessTokens = {
    issueAccessToken: async () => ({
      success: true,
      data: Object.freeze({ accessToken: "token" }),
    }),
  };
  const passwordHasher = {
    hashPassword: async (password) => `hash:${password}`,
    verifyPassword: async () => true,
  };
  const refreshTokens = {
    hashSecret: async (secret) => `secret:${secret}`,
    save: async () => { },
    findBySecretHash: async () => null,
    revokeFamily: async () => { },
  };
  const sessionManager = {
    createRefreshTokenSecret: async () => ({
      success: true,
      data: Object.freeze({ secret: "refresh", expiresAt: "2099-01-01T00:00:00.000Z" }),
    }),
  };

  const application = await addTechnicalPorts(core, SaasBrCore.create())
    .add(
      authProperties({
        accessTokens,
        passwordHasher,
        refreshTokens,
        sessionManager,
      }),
    )
    .build();

  assert.equal(application.outputs.auth.auth.accessTokens, accessTokens);
  assert.equal(application.outputs.auth.auth.passwordHasher, passwordHasher);
  assert.equal(application.outputs.auth.auth.refreshTokens, refreshTokens);
  assert.equal(application.outputs.auth.auth.sessionManager, sessionManager);
  assert.equal("identityAuthenticator" in application.outputs.auth.auth, false);
  assert.equal("notifications" in application.outputs.auth, false);
  assert.equal(Object.isFrozen(application.outputs.auth), true);
  assert.equal(Object.isFrozen(application.outputs.auth.auth), true);
  assert.equal(application.appContext.auth.accessTokens, accessTokens);
});

test("authProperties registers optional identity and email ports when configured", async () => {
  const core = await importCore();
  const {
    CoreRegistration,
    SaasBrCore,
    authProperties,
    emailNotificationCorePort,
    identityAuthenticatorCorePort,
  } = core;
  const accessTokens = {
    issueAccessToken: async () => ({
      success: true,
      data: Object.freeze({ accessToken: "token" }),
    }),
  };
  const passwordHasher = {
    hashPassword: async (password) => `hash:${password}`,
    verifyPassword: async () => true,
  };
  const refreshTokens = {
    hashSecret: async (secret) => `secret:${secret}`,
    save: async () => { },
    findBySecretHash: async () => null,
    revokeFamily: async () => { },
  };
  const sessionManager = {
    createRefreshTokenSecret: async () => ({
      success: true,
      data: Object.freeze({ secret: "refresh", expiresAt: "2099-01-01T00:00:00.000Z" }),
    }),
  };
  const identityAuthenticator = {
    authenticateIdentity: async () => ({
      success: true,
      data: Object.freeze({ userId: "user_1" }),
    }),
  };
  const emailNotifications = Object.freeze({
    sendPasswordChangedEmail: async () => { },
  });

  const application = await addTechnicalPorts(core, SaasBrCore.create())
    .add(
      authProperties({
        accessTokens,
        passwordHasher,
        refreshTokens,
        sessionManager,
        identityAuthenticator,
        emailNotifications,
      }),
    )
    .add(
      new CoreRegistration({
        name: "auth-optional-consumer",
        requires: [identityAuthenticatorCorePort, emailNotificationCorePort],
        install: (registry) => ({
          context: Object.freeze({}),
          output: Object.freeze({
            identity: registry.resolve(identityAuthenticatorCorePort),
            email: registry.resolve(emailNotificationCorePort),
          }),
        }),
      }),
    )
    .build();

  assert.equal(application.outputs.auth.auth.identityAuthenticator, identityAuthenticator);
  assert.equal(application.outputs.auth.notifications.email, emailNotifications);
  assert.equal(application.outputs["auth-optional-consumer"].identity, identityAuthenticator);
  assert.equal(application.outputs["auth-optional-consumer"].email, emailNotifications);
});

test("CoreContextMerger merges containers, concatenates arrays and ignores undefined", async () => {
  const { CoreContextMerger } = await importContextMerger();
  const merged = new CoreContextMerger().merge([
    Object.freeze({
      appName: "core",
      adapters: Object.freeze({
        cache: Object.freeze({ provider: "mem" }),
        pipelines: Object.freeze(["a"]),
      }),
    }),
    Object.freeze({
      adapters: Object.freeze({
        runtime: Object.freeze({ env: "test" }),
        pipelines: Object.freeze(["b", "c"]),
      }),
      notifications: undefined,
    }),
  ]);

  assert.deepEqual(merged.appName, "core");
  assert.deepEqual(merged.adapters.cache, { provider: "mem" });
  assert.deepEqual(merged.adapters.runtime, { env: "test" });
  assert.deepEqual(merged.adapters.pipelines, ["a", "b", "c"]);
  assert.equal("notifications" in merged, false);
  assert.equal(Object.isFrozen(merged), true);
  assert.equal(Object.isFrozen(merged.adapters), true);
  assert.equal(Object.isFrozen(merged.adapters.pipelines), true);
});

test("CoreContextMerger rejects duplicate and incompatible context assignments", async () => {
  const { CoreContextMerger } = await importContextMerger();
  const merger = new CoreContextMerger();

  assert.throws(
    () => merger.merge([Object.freeze({ clock: "a" }), Object.freeze({ clock: "b" })]),
    {
      code: "core.context_conflict",
      message: 'Context property "clock" was provided more than once.',
    },
  );

  assert.throws(
    () =>
      merger.merge([
        Object.freeze({ adapters: Object.freeze({ pipelines: Object.freeze(["a"]) }) }),
        Object.freeze({ adapters: Object.freeze({ pipelines: Object.freeze({ invalid: true }) }) }),
      ]),
    {
      code: "core.context_conflict",
      message: 'Context property "adapters.pipelines" was provided more than once.',
    },
  );

  assert.throws(
    () =>
      merger.merge([
        Object.freeze({ auth: Object.freeze({ sessionManager: "first" }) }),
        Object.freeze({ auth: Object.freeze({ sessionManager: "second" }) }),
      ]),
    {
      code: "core.context_conflict",
      message: 'Context property "auth.sessionManager" was provided more than once.',
    },
  );
});

test("contextProperties provides a direct .add path for function capabilities", async () => {
  const core = await importCore();
  const { SaasBrCore, contextProperties } = core;
  const calls = [];

  const application = await addTechnicalPorts(core, SaasBrCore.create())
    .add(
      contextProperties(
        "capabilities",
        Object.freeze({
          auth: Object.freeze({
            capabilities: Object.freeze({
              users: Object.freeze({
                insertUser: async (user) => {
                  calls.push(user.id);
                },
              }),
            }),
          }),
        }),
      ),
    )
    .build();

  await application.appContext.auth.capabilities.users.insertUser({ id: "user_1" });
  assert.deepEqual(calls, ["user_1"]);
  assert.equal(application.outputs.capabilities.auth.capabilities.users.insertUser instanceof Function, true);
});
