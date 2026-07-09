import assert from "node:assert/strict";
import test from "node:test";
import { ok } from "#core";
import "reflect-metadata";
import { JwtAuthGuard } from "../../../dist/adapters/runtime-nest/auth/jwt-auth.guard.js";
import { NestExecutionContextFactory } from "../../../dist/adapters/runtime-nest/index.js";

const activeOrganization = Object.freeze({
  id: "org_1",
  ownerUserId: "another_actor",
  status: "active",
  roleConfig: Object.freeze({
    ownerRoleName: "owner",
    employeeRoles: Object.freeze([
      Object.freeze({
        name: "employee",
        permissions: Object.freeze(["billing:plans:read"]),
      }),
    ]),
  }),
});

const activeMembership = Object.freeze({
  organizationId: "org_1",
  userId: "actor_1",
  role: "employee",
  status: "active",
});

function createGuardContext(request) {
  return {
    getHandler: () => function protectedRoute() {},
    getClass: () => class ProtectedController {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };
}

function createGuard({
  organization = activeOrganization,
  membership = activeMembership,
  claims = {
    userId: "actor_1",
    memberships: [
      {
        organizationId: "org_1",
        role: "owner",
        status: "active",
      },
    ],
  },
} = {}) {
  return new JwtAuthGuard(
    { getAllAndOverride: () => false },
    {
      appContext: {
        auth: {
          accessTokens: {
            verifyAccessToken: async () => ok(claims),
          },
        },
        repositories: {
          organizations: {
            findById: async () => organization,
          },
          memberships: {
            findByOrganizationIdAndUserId: async () => membership,
            listByUserId: async () => [membership],
          },
        },
      },
    },
  );
}

test("JWT guard loads current membership permissions instead of token or headers", async () => {
  const request = {
    headers: {
      authorization: "Bearer verified-token",
      "x-actor-id": "spoofed_actor",
      "x-organization-id": "spoofed_org",
      "x-permissions": "*",
    },
  };

  assert.equal(await createGuard().canActivate(createGuardContext(request)), true);
  assert.deepEqual(request.user, {
    userId: "actor_1",
    organizationId: "org_1",
    permissions: ["billing:plans:read"],
  });

  const executionContext = new NestExecutionContextFactory().create(request);
  assert.deepEqual(executionContext.actor, { type: "user", id: "actor_1" });
  assert.equal(executionContext.organizationId, "org_1");
  assert.deepEqual(executionContext.permissions, ["billing:plans:read"]);
});

test("JWT guard removes tenant authorization after membership revocation", async () => {
  const guard = createGuard({
    membership: {
      ...activeMembership,
      status: "disabled",
    },
  });
  const request = {
    headers: {
      authorization: "Bearer stale-token",
    },
  };

  assert.equal(await guard.canActivate(createGuardContext(request)), true);
  assert.deepEqual(request.user, {
    userId: "actor_1",
    permissions: [],
  });
  const executionContext = new NestExecutionContextFactory().create(request, {
    organizationId: "spoofed_org",
    permissions: ["*"],
  });
  assert.deepEqual(executionContext.actor, { type: "user", id: "actor_1" });
  assert.equal(executionContext.organizationId, undefined);
  assert.deepEqual(executionContext.permissions, []);
});

test("JWT guard removes tenant authorization for a disabled organization", async () => {
  const guard = createGuard({
    organization: {
      ...activeOrganization,
      status: "disabled",
    },
  });
  const request = {
    headers: {
      authorization: "Bearer stale-token",
    },
  };

  assert.equal(await guard.canActivate(createGuardContext(request)), true);
  assert.deepEqual(request.user, {
    userId: "actor_1",
    permissions: [],
  });
});

test("JWT guard resolves tenant authorization from persisted access when token has no memberships", async () => {
  const guard = createGuard({
    claims: {
      userId: "actor_1",
    },
  });
  const request = {
    headers: {
      authorization: "Bearer token-without-memberships",
    },
  };

  assert.equal(await guard.canActivate(createGuardContext(request)), true);
  assert.deepEqual(request.user, {
    userId: "actor_1",
    organizationId: "org_1",
    permissions: ["billing:plans:read"],
  });
});
