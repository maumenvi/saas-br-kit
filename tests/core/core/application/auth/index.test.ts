import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));
const loadTesting = async () => import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")));

function createMemoryAuthPorts(core) {
  const users = new Map();
  const organizations = new Map();
  const credentialsByEmail = new Map();
  const refreshSessions = new Map();
  const passwordResetTokens = new Map();
  const federatedIdentities = new Map();
  const accessTokenRequests = [];
  const sentEmails = [];
  let passwordVerifyCalls = 0;
  let refreshSecretCounter = 1;
  let refreshExpiresAt = "2026-07-18T12:00:00.000Z";

  const refreshTokens = {
    get entries() {
      return Object.freeze([...refreshSessions.values()]);
    },
    setRefreshExpiresAt: (expiresAt) => {
      refreshExpiresAt = expiresAt;
    },
    hashSecret: async (secret) => `hash:${secret}`,
    save: async (session) => {
      refreshSessions.set(session.id, session);
    },
    findBySecretHash: async (secretHash) =>
      [...refreshSessions.values()].find((session) => session.secretHash === secretHash) ?? null,
    revokeFamily: async ({ familyId, revokedAt, reason }) => {
      for (const session of refreshSessions.values()) {
        if (session.familyId !== familyId) {
          continue;
        }

        const revoked = core.RefreshTokenSessionTransitions.revoke(session, { revokedAt, reason });
        assert.equal(revoked.ok, true);
        refreshSessions.set(revoked.data.id, revoked.data);
      }
    },
  };

  return {
    state: {
      users,
      organizations,
      credentialsByEmail,
      refreshTokens,
      passwordResetTokens,
      federatedIdentities,
      accessTokenRequests,
      sentEmails,
      get passwordVerifyCalls() {
        return passwordVerifyCalls;
      },
    },
    auth: {
      users: {
        save: async (user) => {
          users.set(user.id, user);
        },
        findById: async (userId) => users.get(userId) ?? null,
        findByEmail: async (email) =>
          [...users.values()].find((user) => user.email === email.toLowerCase()) ?? null,
        list: async () => [...users.values()],
      },
      userCredentials: {
        findByEmail: async (email) => credentialsByEmail.get(email) ?? null,
        save: async (credentials) => {
          credentialsByEmail.set(credentials.email, credentials);
        },
      },
      passwordHasher: {
        hashPassword: async (password) => `hashed:${password}`,
        verifyPassword: async ({ password, passwordHash }) => {
          passwordVerifyCalls += 1;
          return passwordHash === `hashed:${password}`;
        },
      },
      accessTokens: {
        issueAccessToken: async (input) => {
          accessTokenRequests.push(input);
          return core.ok({
            accessToken: `access:${input.user.id}:${input.issuedAt}`,
            expiresAt: "2026-06-18T12:15:00.000Z",
          });
        },
      },
      refreshTokens,
      passwordResetTokens: {
        save: async (record) => {
          passwordResetTokens.set(record.secretHash, record);
        },
        findBySecretHash: async (secretHash) => passwordResetTokens.get(secretHash) ?? null,
      },
      sessionManager: {
        createRefreshTokenSecret: async () =>
          core.ok({
            secret: `refresh_secret_${refreshSecretCounter++}`,
            expiresAt: refreshExpiresAt,
          }),
      },
      federatedIdentities: {
        save: async (identity) => {
          federatedIdentities.set(`${identity.issuer}|${identity.subject}`, identity);
        },
        findByIssuerAndSubject: async ({ issuer, subject }) =>
          federatedIdentities.get(`${issuer}|${subject}`) ?? null,
        findByUserIdAndIssuer: async ({ userId, issuer }) =>
          [...federatedIdentities.values()].find(
            (identity) => identity.userId === userId && identity.issuer === issuer,
          ) ?? null,
      },
      emailNotifications: {
        sendAccountCreatedEmail: async (input) => {
          sentEmails.push({ kind: "account-created", ...input });
        },
        sendPasswordResetRequestedEmail: async (input) => {
          sentEmails.push({ kind: "password-reset-requested", ...input });
        },
        sendPasswordChangedEmail: async (input) => {
          sentEmails.push({ kind: "password-changed", ...input });
        },
      },
    },
  };
}

async function createAuthAppContext({ tenantAccess } = {}) {
  const core = await loadCore();
  const testing = await loadTesting();
  const memory = createMemoryAuthPorts(core);
  const logger = testing.createInMemoryLogger();
  const appContext = core.SaasBrContext.create({
    clock: testing.createFixedClock(new Date("2026-06-18T12:00:00.000Z")),
    idGenerator: testing.createSequentialIdGenerator("auth"),
    logger,
    transactionManager: testing.createPassthroughTransactionManager(),
    adapters: {},
  });

  return {
    core,
    logger,
    appContext: {
      ...appContext,
      auth: memory.auth,
      notifications: {
        email: memory.auth.emailNotifications,
      },
      repositories: {
        organizations: {
          save: async (organization) => {
            memory.state.organizations.set(organization.id, organization);
          },
          findById: async (organizationId) =>
            memory.state.organizations.get(organizationId) ?? null,
          listByOwnerUserId: async (ownerUserId) =>
            [...memory.state.organizations.values()].filter(
              (organization) => organization.ownerUserId === ownerUserId,
            ),
        },
      },
      ...(tenantAccess === undefined ? {} : { tenantAccess }),
    },
    state: memory.state,
  };
}

async function seedUser(core, state, input = {}) {
  const user = core.User.create({
    id: input.id ?? "user_1",
    email: input.email ?? "user@example.com",
    displayName: input.displayName ?? "User One",
    status: input.status ?? "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const credentials = core.UserCredentials.create({
    userId: input.id ?? "user_1",
    email: input.email ?? "user@example.com",
    passwordHash: input.passwordHash ?? "hashed:correct-password",
    status: input.credentialsStatus ?? "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(user.ok, true);
  assert.equal(credentials.ok, true);
  state.users.set(user.data.id, user.data);
  state.credentialsByEmail.set(credentials.data.email, credentials.data);

  return user.data;
}

test("auth domain factories normalize users, credentials and refresh sessions", async () => {
  const core = await loadCore();
  const user = core.User.create({
    id: "user_1",
    email: "  USER@Example.COM  ",
    displayName: "  User One  ",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const credentials = core.UserCredentials.create({
    userId: "user_1",
    email: "USER@Example.COM",
    passwordHash: "hashed:password",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const session = core.RefreshTokenSessionFactory.create({
    id: "refresh_1",
    userId: "user_1",
    familyId: "family_1",
    secretHash: "hash:refresh_secret",
    expiresAt: "2026-07-18T12:00:00.000Z",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(user.ok, true);
  assert.equal(user.data.email, "user@example.com");
  assert.equal(credentials.ok, true);
  assert.equal(credentials.data.email, "user@example.com");
  assert.equal(session.ok, true);
  assert.equal(session.data.secretHash, "hash:refresh_secret");
  assert.equal(Object.isFrozen(session.data), true);
});

test("federated identity validates issuer and keeps issuer plus subject as stable key", async () => {
  const core = await loadCore();
  const identity = core.FederatedIdentity.create({
    id: "identity_1",
    userId: "user_1",
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "subject_1",
    email: "USER@example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const invalid = core.FederatedIdentity.create({
    id: "identity_2",
    userId: "user_1",
    providerId: "invalid",
    issuer: "http://provider.example.com",
    subject: "subject_2",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(identity.ok, true);
  assert.equal(identity.data.email, "user@example.com");
  assert.equal(Object.isFrozen(identity.data), true);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.code, "federatedIdentity.issuer.invalid");
});

test("federated login creates a local identity and emits only internal session tokens", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_oidc_login",
    actor: { type: "system" },
  });
  const input = {
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "google_subject_1",
    email: "federated@example.com",
    emailVerified: true,
    displayName: "Federated User",
  };

  const created = await new core.LoginWithFederatedIdentityUseCase(appContext).execute(
    executionContext,
    input,
  );
  const repeated = await new core.LoginWithFederatedIdentityUseCase(appContext).execute(
    executionContext,
    { ...input, email: undefined, emailVerified: undefined },
  );

  assert.equal(created.ok, true);
  assert.equal(created.data.user.email, "federated@example.com");
  assert.match(created.data.accessToken, /^access:/);
  assert.match(created.data.refreshToken, /^refresh_secret_/);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.data.user.id, created.data.user.id);
  assert.equal(state.users.size, 1);
  assert.equal(state.federatedIdentities.size, 1);
});

test("federated login requires explicit linking when a local email already exists", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, { email: "existing@example.com" });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_oidc_conflict",
    actor: { type: "system" },
  });

  const result = await new core.LoginWithFederatedIdentityUseCase(appContext).execute(
    executionContext,
    {
      providerId: "microsoft",
      issuer: "https://login.microsoftonline.com/common/v2.0",
      subject: "entra_subject_1",
      email: "existing@example.com",
      emailVerified: true,
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "federated_identity.link_required");
  assert.equal(state.federatedIdentities.size, 0);
});

test("authenticated users can explicitly link and then use a federated identity", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  const user = await seedUser(core, state, { email: "linked@example.com" });
  const claims = {
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "google_subject_linked",
    email: "linked@example.com",
    emailVerified: true,
  };
  const linkContext = core.ExecutionContext.create({
    requestId: "req_oidc_link",
    actor: { type: "user", id: user.id },
  });
  const callbackContext = core.ExecutionContext.create({
    requestId: "req_oidc_login_linked",
    actor: { type: "system" },
  });

  const linked = await new core.LinkFederatedIdentityUseCase(appContext).execute(
    linkContext,
    claims,
  );
  const login = await new core.LoginWithFederatedIdentityUseCase(appContext).execute(
    callbackContext,
    claims,
  );

  assert.equal(linked.ok, true);
  assert.equal(linked.data.userId, user.id);
  assert.equal(login.ok, true);
  assert.equal(login.data.user.id, user.id);
});

test("CreateAccountUseCase creates actor, credentials, organization and returns login tokens", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  const executionContext = core.ExecutionContext.create({
    requestId: "req_create_account",
    actor: { type: "system" },
  });

  const result = await new core.CreateAccountUseCase(appContext).execute(executionContext, {
    email: "owner@example.com",
    password: "strong-password",
    displayName: "Owner",
    organizationName: "Owner Org",
    organizationSubdomain: "owner-org",
    organizationUrl: "https://owner-org.example.com",
    deviceId: "browser_1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.user.email, "owner@example.com");
  assert.equal(result.data.organization.ownerUserId, result.data.user.id);
  assert.equal(result.data.organization.name, "Owner Org");
  assert.equal(state.organizations.size, 1);
  assert.equal(state.credentialsByEmail.get("owner@example.com")?.userId, result.data.user.id);
  assert.equal(result.data.accessToken.startsWith(`access:${result.data.user.id}:`), true);
  assert.equal(result.data.refreshToken.startsWith("refresh_secret_"), true);
  assert.equal(result.data.organizations?.[0]?.organizationId, result.data.organization.id);
  assert.deepEqual(state.sentEmails, [
    {
      kind: "account-created",
      to: "owner@example.com",
      userId: result.data.user.id,
      displayName: "Owner",
      organizationId: result.data.organization.id,
      organizationName: "Owner Org",
      organizationSubdomain: "owner-org",
      organizationUrl: "https://owner-org.example.com",
    },
  ]);
});

test("CreateAccountUseCase rejects duplicated emails", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "existing_user",
    email: "owner@example.com",
    passwordHash: "hashed:strong-password",
  });
  const executionContext = core.ExecutionContext.create({
    requestId: "req_create_account_conflict",
    actor: { type: "system" },
  });

  const result = await new core.CreateAccountUseCase(appContext).execute(executionContext, {
    email: "owner@example.com",
    password: "strong-password",
    organizationName: "Owner Org",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "conflict");
  assert.equal(result.error.code, "account.email_conflict");
  assert.equal(state.organizations.size, 0);
});

test("ChangePasswordUseCase updates credentials and allows login with new password", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_1",
    email: "user@example.com",
    passwordHash: "hashed:old-password",
  });

  const change = await new core.ChangePasswordUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_change_password",
      actor: { type: "user", id: "user_1" },
    }),
    {
      actorId: "user_1",
      currentPassword: "old-password",
      newPassword: "new-password",
    },
  );

  assert.equal(change.ok, true);
  assert.equal(change.data.changed, true);
  assert.equal(
    state.credentialsByEmail.get("user@example.com")?.passwordHash,
    "hashed:new-password",
  );
  assert.equal(state.sentEmails.at(-1)?.kind, "password-changed");
  assert.equal(state.sentEmails.at(-1)?.to, "user@example.com");

  const login = await new core.LoginWithPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_login_new_password",
      actor: { type: "system" },
    }),
    {
      email: "user@example.com",
      password: "new-password",
    },
  );

  assert.equal(login.ok, true);
});

test("auth email flows log an error when the notification handler is missing", async () => {
  const { appContext, core, logger, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_1",
    email: "user@example.com",
    passwordHash: "hashed:correct-password",
  });
  const withoutPasswordChangedHandler = {
    ...appContext,
    notifications: {
      email: {
        sendAccountCreatedEmail: appContext.notifications.email.sendAccountCreatedEmail,
      },
    },
  };

  const result = await new core.ChangePasswordUseCase(withoutPasswordChangedHandler).execute(
    core.ExecutionContext.create({
      requestId: "req_change_password_missing_handler",
      actor: { type: "user", id: "user_1" },
    }),
    {
      actorId: "user_1",
      currentPassword: "correct-password",
      newPassword: "new-password",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(
    logger.entries.some(
      (entry) =>
        entry.level === "error" &&
        entry.message === "Email notification handler is not configured." &&
        entry.context?.handlerName === "sendPasswordChangedEmail",
    ),
    true,
  );
});

test("ChangePasswordUseCase rejects wrong current password and keeps hash unchanged", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_1",
    email: "user@example.com",
    passwordHash: "hashed:correct-password",
  });

  const result = await new core.ChangePasswordUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_change_password_denied",
      actor: { type: "user", id: "user_1" },
    }),
    {
      actorId: "user_1",
      currentPassword: "wrong-password",
      newPassword: "new-password",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "auth.invalid_credentials");
  assert.equal(
    state.credentialsByEmail.get("user@example.com")?.passwordHash,
    "hashed:correct-password",
  );
});

test("ChangePasswordUseCase enforces actor ownership", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_1",
    email: "user@example.com",
    passwordHash: "hashed:correct-password",
  });

  const result = await new core.ChangePasswordUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_change_password_forbidden",
      actor: { type: "user", id: "user_2" },
    }),
    {
      actorId: "user_1",
      currentPassword: "correct-password",
      newPassword: "new-password",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "core.actor_user_mismatch");
});

test("ForgotPasswordUseCase stores reset token and emits email without leaking existence", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_1",
    email: "user@example.com",
    passwordHash: "hashed:correct-password",
  });

  const result = await new core.ForgotPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_forgot", actor: { type: "system" } }),
    {
      email: "user@example.com",
      resetUrlBase: "https://app.example.com/reset-password",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.requested, true);
  assert.equal(state.passwordResetTokens.size, 1);
  assert.equal(state.sentEmails.at(-1)?.kind, "password-reset-requested");
  assert.equal(state.sentEmails.at(-1)?.to, "user@example.com");
});

test("ResetPasswordUseCase changes password and consumes reset token", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_1",
    email: "user@example.com",
    passwordHash: "hashed:correct-password",
  });

  await new core.ForgotPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_forgot", actor: { type: "system" } }),
    { email: "user@example.com" },
  );

  const resetEmail = state.sentEmails.at(-1);
  assert.equal(resetEmail?.kind, "password-reset-requested");
  const resetToken = resetEmail?.token;
  assert.equal(typeof resetToken, "string");

  const result = await new core.ResetPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_reset", actor: { type: "system" } }),
    {
      token: resetToken,
      newPassword: "new-password",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.changed, true);
  assert.equal(
    state.credentialsByEmail.get("user@example.com")?.passwordHash,
    "hashed:new-password",
  );
  assert.equal(
    [...state.passwordResetTokens.values()].every((record) => record.consumedAt !== undefined),
    true,
  );
});

test("LoginWithPasswordUseCase issues access token and opaque refresh token through ports", async () => {
  const { appContext, core, logger, state } = await createAuthAppContext();
  await seedUser(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_login",
    actor: { type: "system" },
  });

  const result = await new core.LoginWithPasswordUseCase(appContext).execute(executionContext, {
    email: "USER@example.com",
    password: "correct-password",
    deviceId: "device_1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.user.id, "user_1");
  assert.equal(result.data.accessToken, "access:user_1:2026-06-18T12:00:00.000Z");
  assert.equal(result.data.refreshToken, "refresh_secret_1");
  assert.equal(state.refreshTokens.entries.length, 1);
  assert.equal(state.refreshTokens.entries[0].secretHash, "hash:refresh_secret_1");
  assert.equal(JSON.stringify(logger.entries).includes("correct-password"), false);
  assert.equal(JSON.stringify(logger.entries).includes("refresh_secret_1"), false);
});

test("LoginWithPasswordUseCase rejects invalid credentials without creating refresh session", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_login_denied",
    actor: { type: "system" },
  });

  const result = await new core.LoginWithPasswordUseCase(appContext).execute(executionContext, {
    email: "user@example.com",
    password: "wrong-password",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "authorization");
  assert.equal(result.error.code, "auth.invalid_credentials");
  assert.equal(state.refreshTokens.entries.length, 0);
});

test("LoginWithPasswordUseCase uses custom identity authenticator adapter when provided", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_login_adapter",
    actor: { type: "system" },
  });

  const adaptedContext = {
    ...appContext,
    auth: {
      ...appContext.auth,
      identityAuthenticator: {
        authenticateIdentity: async ({ email, password }) => {
          assert.equal(email, "user@example.com");
          assert.equal(password, "provider-token");
          return core.ok({ userId: "user_1" });
        },
      },
    },
  };

  const result = await new core.LoginWithPasswordUseCase(adaptedContext).execute(executionContext, {
    email: "user@example.com",
    password: "provider-token",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.user.id, "user_1");
  assert.equal(state.passwordVerifyCalls, 0);
});

test("RefreshAuthTokenUseCase rotates active refresh tokens and detects reuse", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_refresh",
    actor: { type: "system" },
  });
  const login = await new core.LoginWithPasswordUseCase(appContext).execute(executionContext, {
    email: "user@example.com",
    password: "correct-password",
  });
  assert.equal(login.ok, true);

  const refreshed = await new core.RefreshAuthTokenUseCase(appContext).execute(executionContext, {
    refreshToken: login.data.refreshToken,
  });
  const reused = await new core.RefreshAuthTokenUseCase(appContext).execute(executionContext, {
    refreshToken: login.data.refreshToken,
  });

  assert.equal(refreshed.ok, true);
  assert.equal(refreshed.data.refreshToken, "refresh_secret_2");
  assert.equal(
    state.refreshTokens.entries.find((session) => session.id === login.data.refreshTokenSessionId)
      .status,
    "revoked",
  );
  assert.equal(reused.ok, false);
  assert.equal(reused.error.kind, "conflict");
  assert.equal(reused.error.code, "auth.refresh_token_reuse_detected");
  assert.equal(
    state.refreshTokens.entries.every((session) => session.status === "revoked"),
    true,
  );
});

test("RefreshAuthTokenUseCase rejects expired refresh tokens and stores revocation", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state);
  const expired = core.RefreshTokenSessionFactory.create({
    id: "refresh_expired",
    userId: "user_1",
    familyId: "family_expired",
    secretHash: await state.refreshTokens.hashSecret("expired_secret"),
    expiresAt: "2026-06-18T11:59:00.000Z",
    createdAt: "2026-06-18T11:00:00.000Z",
  });
  assert.equal(expired.ok, true);
  await state.refreshTokens.save(expired.data);

  const result = await new core.RefreshAuthTokenUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_expired", actor: { type: "system" } }),
    { refreshToken: "expired_secret" },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "authorization");
  assert.equal(result.error.code, "auth.refresh_token_expired");
  assert.equal(state.refreshTokens.entries[0].status, "revoked");
  assert.equal(state.refreshTokens.entries[0].revokedReason, "expired");
});

test("LogoutUseCase revokes refresh token without logging raw token", async () => {
  const { appContext, core, logger, state } = await createAuthAppContext();
  await seedUser(core, state);
  const executionContext = core.ExecutionContext.create({
    requestId: "req_logout",
    actor: { type: "system" },
  });
  const login = await new core.LoginWithPasswordUseCase(appContext).execute(executionContext, {
    email: "user@example.com",
    password: "correct-password",
  });
  assert.equal(login.ok, true);

  const loggedOut = await new core.LogoutUseCase(appContext).execute(executionContext, {
    refreshToken: login.data.refreshToken,
  });

  assert.equal(loggedOut.ok, true);
  assert.equal(loggedOut.data.loggedOut, true);
  assert.equal(state.refreshTokens.entries[0].status, "revoked");
  assert.equal(state.refreshTokens.entries[0].revokedReason, "logout");
  assert.equal(JSON.stringify(logger.entries).includes(login.data.refreshToken), false);
});

test("GetAuthenticatedProfileUseCase loads the active user from execution context", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state);
  const result = await new core.GetAuthenticatedProfileUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_profile",
      actor: { type: "user", id: "user_1" },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.user.email, "user@example.com");
});

test("login filters organization access by URL and emits only matching token memberships", async () => {
  const core = await loadCore();
  const first = core.Organization.create({
    id: "org_1",
    ownerUserId: "owner_1",
    name: "Store One",
    url: "https://one.example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
    roleConfig: {
      ownerRoleName: "proprietario",
      employeeRoles: [{ name: "manager", permissions: ["orders:read"] }],
    },
  });
  const second = core.Organization.create({
    id: "org_2",
    ownerUserId: "owner_2",
    name: "Store Two",
    url: "https://two.example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const firstMembership = core.Membership.create({
    id: "member_1",
    organizationId: "org_1",
    userId: "user_1",
    role: "manager",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const secondMembership = core.Membership.create({
    id: "member_2",
    organizationId: "org_2",
    userId: "user_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(firstMembership.ok, true);
  assert.equal(secondMembership.ok, true);
  const organizations = new Map([
    [first.data.id, first.data],
    [second.data.id, second.data],
  ]);
  const { appContext, state } = await createAuthAppContext({
    tenantAccess: {
      memberships: {
        listByUserId: async () => [firstMembership.data, secondMembership.data],
      },
      organizations: {
        findById: async (id) => organizations.get(id) ?? null,
      },
    },
  });
  await seedUser(core, state);

  const result = await new core.LoginWithPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_url_login", actor: { type: "system" } }),
    {
      email: "user@example.com",
      password: "correct-password",
      organizationUrl: "https://one.example.com/",
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.organizations, [
    {
      organizationId: "org_1",
      name: "Store One",
      role: "manager",
      permissions: ["orders:read"],
      url: "https://one.example.com",
    },
  ]);
  assert.deepEqual(state.accessTokenRequests[0].memberships, [
    { organizationId: "org_1", role: "manager", status: "active" },
  ]);
});

test("login without URL returns every active accessible organization", async () => {
  const core = await loadCore();
  const owned = core.Organization.create({
    id: "owned_org",
    ownerUserId: "user_1",
    name: "Owned store",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const inactive = core.Organization.create({
    id: "inactive_org",
    ownerUserId: "user_1",
    name: "Inactive store",
    status: "disabled",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(owned.ok, true);
  assert.equal(inactive.ok, true);
  const { appContext, state } = await createAuthAppContext({
    tenantAccess: {
      memberships: { listByUserId: async () => [] },
      organizations: {
        findById: async () => null,
        listByOwnerUserId: async () => [owned.data, inactive.data],
      },
    },
  });
  await seedUser(core, state);

  const result = await new core.LoginWithPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_all_orgs", actor: { type: "system" } }),
    {
      email: "user@example.com",
      password: "correct-password",
      organizationUrl: null,
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.organizations, [
    {
      organizationId: "owned_org",
      name: "Owned store",
      role: "owner",
      permissions: ["*"],
    },
  ]);
});

test("login rejects invalid, inaccessible and unconfigured organization URLs", async () => {
  const core = await loadCore();
  const tenantAccess = {
    memberships: { listByUserId: async () => [] },
    organizations: { findById: async () => null },
  };
  const configured = await createAuthAppContext({ tenantAccess });
  await seedUser(core, configured.state);
  const context = core.ExecutionContext.create({
    requestId: "req_rejected_url",
    actor: { type: "system" },
  });
  const invalid = await new core.LoginWithPasswordUseCase(configured.appContext).execute(context, {
    email: "user@example.com",
    password: "correct-password",
    organizationUrl: "not-a-url",
  });
  const denied = await new core.LoginWithPasswordUseCase(configured.appContext).execute(context, {
    email: "user@example.com",
    password: "correct-password",
    organizationUrl: "https://unknown.example.com",
  });
  const unconfigured = await createAuthAppContext();
  await seedUser(core, unconfigured.state);
  const missingPorts = await new core.LoginWithPasswordUseCase(unconfigured.appContext).execute(
    context,
    {
      email: "user@example.com",
      password: "correct-password",
      organizationUrl: "https://one.example.com",
    },
  );

  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.code, "auth.organization_url_invalid");
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "auth.organization_url_access_denied");
  assert.equal(missingPorts.ok, false);
  assert.equal(missingPorts.error.code, "auth.tenant_access_unconfigured");
});

test("LinkFederatedIdentityUseCase enforces user actor and active local user", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "disabled_user",
    email: "disabled@example.com",
    status: "disabled",
  });

  const deniedActor = await new core.LinkFederatedIdentityUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_link_system",
      actor: { type: "system" },
    }),
    {
      providerId: "google",
      issuer: "https://accounts.google.com",
      subject: "subject_1",
    },
  );

  const notFound = await new core.LinkFederatedIdentityUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_link_disabled",
      actor: { type: "user", id: "disabled_user" },
    }),
    {
      providerId: "google",
      issuer: "https://accounts.google.com",
      subject: "subject_2",
    },
  );

  assert.equal(deniedActor.ok, false);
  assert.equal(deniedActor.error.code, "federated_identity.user_actor_required");
  assert.equal(notFound.ok, false);
  assert.equal(notFound.error.code, "actor.not_found");
});

test("LinkFederatedIdentityUseCase handles already-linked and issuer-conflict branches", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  const linkedUser = await seedUser(core, state, {
    id: "user_linked",
    email: "linked@example.com",
  });
  await seedUser(core, state, { id: "user_other", email: "other@example.com" });

  const sameIdentity = core.FederatedIdentity.create({
    id: "identity_same",
    userId: linkedUser.id,
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "same_subject",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const foreignIdentity = core.FederatedIdentity.create({
    id: "identity_foreign",
    userId: "user_other",
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "foreign_subject",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const sameIssuerIdentity = core.FederatedIdentity.create({
    id: "identity_same_issuer",
    userId: linkedUser.id,
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "existing_issuer_subject",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(sameIdentity.ok, true);
  assert.equal(foreignIdentity.ok, true);
  assert.equal(sameIssuerIdentity.ok, true);
  state.federatedIdentities.set(
    `${sameIdentity.data.issuer}|${sameIdentity.data.subject}`,
    sameIdentity.data,
  );
  state.federatedIdentities.set(
    `${foreignIdentity.data.issuer}|${foreignIdentity.data.subject}`,
    foreignIdentity.data,
  );
  state.federatedIdentities.set(
    `${sameIssuerIdentity.data.issuer}|${sameIssuerIdentity.data.subject}`,
    sameIssuerIdentity.data,
  );

  const context = core.ExecutionContext.create({
    requestId: "req_link_existing",
    actor: { type: "user", id: linkedUser.id },
  });

  const idempotent = await new core.LinkFederatedIdentityUseCase(appContext).execute(context, {
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "same_subject",
  });
  const alreadyLinked = await new core.LinkFederatedIdentityUseCase(appContext).execute(context, {
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "foreign_subject",
  });
  const issuerConflict = await new core.LinkFederatedIdentityUseCase(appContext).execute(context, {
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "new_subject",
  });

  assert.equal(idempotent.ok, true);
  assert.equal(idempotent.data.id, "identity_same");
  assert.equal(alreadyLinked.ok, false);
  assert.equal(alreadyLinked.error.code, "federated_identity.already_linked");
  assert.equal(issuerConflict.ok, false);
  assert.equal(issuerConflict.error.code, "federated_identity.issuer_already_linked");
});

test("ResetPasswordUseCase rejects unavailable, consumed and expired reset tokens", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_reset",
    email: "reset@example.com",
    passwordHash: "hashed:old-password",
  });

  const noStoreContext = {
    ...appContext,
    auth: {
      ...appContext.auth,
      passwordResetTokens: undefined,
    },
  };
  const unavailable = await new core.ResetPasswordUseCase(noStoreContext).execute(
    core.ExecutionContext.create({ requestId: "req_reset_unavailable", actor: { type: "system" } }),
    {
      token: "any-token",
      newPassword: "new-password",
    },
  );

  const now = appContext.clock.now().toISOString();
  const consumedSecretHash = await appContext.auth.refreshTokens.hashSecret("consumed-token");
  const expiredSecretHash = await appContext.auth.refreshTokens.hashSecret("expired-token");
  await appContext.auth.passwordResetTokens.save(
    Object.freeze({
      id: "reset_consumed",
      userId: "user_reset",
      secretHash: consumedSecretHash,
      expiresAt: new Date(Date.parse(now) + 10 * 60 * 1000).toISOString(),
      createdAt: now,
      consumedAt: now,
    }),
  );
  await appContext.auth.passwordResetTokens.save(
    Object.freeze({
      id: "reset_expired",
      userId: "user_reset",
      secretHash: expiredSecretHash,
      expiresAt: new Date(Date.parse(now) - 60 * 1000).toISOString(),
      createdAt: now,
    }),
  );

  const consumed = await new core.ResetPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_reset_consumed", actor: { type: "system" } }),
    {
      token: "consumed-token",
      newPassword: "new-password",
    },
  );
  const expired = await new core.ResetPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_reset_expired", actor: { type: "system" } }),
    {
      token: "expired-token",
      newPassword: "new-password",
    },
  );

  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.error.code, "auth.password_reset_unavailable");
  assert.equal(consumed.ok, false);
  assert.equal(consumed.error.code, "auth.password_reset_token_invalid");
  assert.equal(expired.ok, false);
  assert.equal(expired.error.code, "auth.password_reset_token_expired");
});

test("LogoutUseCase returns loggedOut=false when refresh session does not exist", async () => {
  const { appContext, core } = await createAuthAppContext();
  const result = await new core.LogoutUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_logout_missing", actor: { type: "system" } }),
    {
      refreshToken: "missing-token",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.loggedOut, false);
});

test("GetAuthenticatedProfileUseCase enforces user actor and active user status", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_disabled",
    email: "profile-disabled@example.com",
    status: "disabled",
  });

  const wrongActor = await new core.GetAuthenticatedProfileUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_profile_system", actor: { type: "system" } }),
  );
  const disabled = await new core.GetAuthenticatedProfileUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_profile_disabled",
      actor: { type: "user", id: "user_disabled" },
    }),
  );

  assert.equal(wrongActor.ok, false);
  assert.equal(wrongActor.error.code, "auth.user_actor_required");
  assert.equal(disabled.ok, false);
  assert.equal(disabled.error.code, "auth.user_disabled");
});

test("federated login can return tenant organizations when tenant access is configured", async () => {
  const core = await loadCore();
  const organization = core.Organization.create({
    id: "org_federated",
    ownerUserId: "owner_1",
    name: "Federated Org",
    url: "https://federated.example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const membership = core.Membership.create({
    id: "member_federated",
    organizationId: "org_federated",
    userId: "user_1",
    role: "owner",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(membership.ok, true);

  const { appContext, state } = await createAuthAppContext({
    tenantAccess: {
      memberships: {
        listByUserId: async () => [membership.data],
      },
      organizations: {
        findById: async (id) => (id === organization.data.id ? organization.data : null),
        listByOwnerUserId: async () => [],
      },
    },
  });
  await seedUser(core, state, { id: "user_1", email: "federated-org@example.com" });
  const linked = core.FederatedIdentity.create({
    id: "identity_org",
    userId: "user_1",
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "subject_org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(linked.ok, true);
  state.federatedIdentities.set(`${linked.data.issuer}|${linked.data.subject}`, linked.data);

  const result = await new core.LoginWithFederatedIdentityUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_federated_org", actor: { type: "system" } }),
    {
      providerId: "google",
      issuer: "https://accounts.google.com",
      subject: "subject_org",
      email: "federated-org@example.com",
      emailVerified: true,
      organizationUrl: "https://federated.example.com",
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.organizations, [
    {
      organizationId: "org_federated",
      name: "Federated Org",
      role: "owner",
      permissions: ["*"],
      url: "https://federated.example.com",
    },
  ]);
  assert.deepEqual(state.accessTokenRequests.at(-1)?.memberships, [
    { organizationId: "org_federated", role: "owner", status: "active" },
  ]);
});

test("GetAuthenticatedProfileUseCase returns not found when user is missing", async () => {
  const { appContext, core } = await createAuthAppContext();
  const result = await new core.GetAuthenticatedProfileUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_profile_missing",
      actor: { type: "user", id: "absent_user" },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "auth.user_not_found");
});

test("ResetPasswordUseCase rejects token when credentials are not active", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, {
    id: "user_inactive_credentials",
    email: "inactive-credentials@example.com",
    passwordHash: "hashed:old-password",
    credentialsStatus: "disabled",
  });

  const now = appContext.clock.now().toISOString();
  const secretHash = await appContext.auth.refreshTokens.hashSecret("inactive-token");
  await appContext.auth.passwordResetTokens.save(
    Object.freeze({
      id: "reset_inactive_credentials",
      userId: "user_inactive_credentials",
      secretHash,
      expiresAt: new Date(Date.parse(now) + 10 * 60 * 1000).toISOString(),
      createdAt: now,
    }),
  );

  const result = await new core.ResetPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_reset_inactive_credentials",
      actor: { type: "system" },
    }),
    {
      token: "inactive-token",
      newPassword: "new-password",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "auth.password_reset_token_invalid");
});

test("federated login propagates tenant access errors from session service", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, { id: "user_tenant_error", email: "tenant-error@example.com" });
  const linked = core.FederatedIdentity.create({
    id: "identity_tenant_error",
    userId: "user_tenant_error",
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "subject_tenant_error",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(linked.ok, true);
  state.federatedIdentities.set(`${linked.data.issuer}|${linked.data.subject}`, linked.data);

  const result = await new core.LoginWithFederatedIdentityUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_federated_tenant_error",
      actor: { type: "system" },
    }),
    {
      providerId: "google",
      issuer: "https://accounts.google.com",
      subject: "subject_tenant_error",
      organizationUrl: "https://tenant-required.example.com",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "auth.tenant_access_unconfigured");
});

test("federated login propagates session issuance failures", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, { id: "user_session_error", email: "session-error@example.com" });
  const linked = core.FederatedIdentity.create({
    id: "identity_session_error",
    userId: "user_session_error",
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "subject_session_error",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(linked.ok, true);
  state.federatedIdentities.set(`${linked.data.issuer}|${linked.data.subject}`, linked.data);

  const failingContext = {
    ...appContext,
    auth: {
      ...appContext.auth,
      accessTokens: {
        issueAccessToken: async () =>
          core.fail(
            core.createCoreError({
              kind: "external",
              code: "auth.access_token_issue_failed",
              message: "Access token provider failed.",
            }),
          ),
      },
    },
  };

  const result = await new core.LoginWithFederatedIdentityUseCase(failingContext).execute(
    core.ExecutionContext.create({
      requestId: "req_federated_session_error",
      actor: { type: "system" },
    }),
    {
      providerId: "google",
      issuer: "https://accounts.google.com",
      subject: "subject_session_error",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "auth.access_token_issue_failed");
});

test("LinkFederatedIdentityUseCase returns domain validation errors from identity creation", async () => {
  const { appContext, core, state } = await createAuthAppContext();
  await seedUser(core, state, { id: "user_link_validation", email: "link-validation@example.com" });

  const result = await new core.LinkFederatedIdentityUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_link_invalid_identity",
      actor: { type: "user", id: "user_link_validation" },
    }),
    {
      providerId: "google",
      issuer: "http://invalid-issuer.example.com",
      subject: "subject_invalid",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "federatedIdentity.issuer.invalid");
});

test("ResetPasswordUseCase propagates missing-user loader failures", async () => {
  const { appContext, core } = await createAuthAppContext();
  const now = appContext.clock.now().toISOString();
  const secretHash = await appContext.auth.refreshTokens.hashSecret("missing-user-token");
  await appContext.auth.passwordResetTokens.save(
    Object.freeze({
      id: "reset_missing_user",
      userId: "absent_user",
      secretHash,
      expiresAt: new Date(Date.parse(now) + 10 * 60 * 1000).toISOString(),
      createdAt: now,
    }),
  );

  const result = await new core.ResetPasswordUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_reset_missing_user",
      actor: { type: "system" },
    }),
    {
      token: "missing-user-token",
      newPassword: "new-password",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "auth.user_not_found");
});
