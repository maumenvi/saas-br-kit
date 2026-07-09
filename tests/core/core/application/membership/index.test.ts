import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const loadCore = async () => import(pathToFileURL(path.join(rootDir, "src/core/index.ts")));
const loadTesting = async () => import(pathToFileURL(path.join(rootDir, "src/testing/index.ts")));

async function createMembershipAppContext() {
  const core = await loadCore();
  const testing = await loadTesting();
  const organizations = new Map();
  const users = new Map();
  const sentEmails = [];
  const memberships = testing.createInMemoryMembershipRepository();
  const logger = testing.createInMemoryLogger();

  assert.equal(memberships instanceof testing.InMemoryMembershipRepositoryAdapter, true);

  const appContext = core.SaasBrContext.create({
    clock: testing.createFixedClock(new Date("2026-06-18T12:00:00.000Z")),
    idGenerator: testing.createSequentialIdGenerator("membership"),
    logger,
    transactionManager: testing.createPassthroughTransactionManager(),
    adapters: {},
  });

  return {
    core,
    logger,
    memberships,
    appContext: {
      ...appContext,
      auth: {
        users: {
          findById: async (userId) => users.get(userId) ?? null,
        },
      },
      notifications: {
        email: {
          sendUserInvitationEmail: async (input) => {
            sentEmails.push({ kind: "user-invited", ...input });
          },
        },
      },
      repositories: {
        organizations: {
          save: async (organization) => {
            organizations.set(organization.id, organization);
          },
          findById: async (organizationId) => organizations.get(organizationId) ?? null,
          listByOwnerUserId: async (ownerUserId) =>
            Object.freeze(
              [...organizations.values()].filter(
                (organization) => organization.ownerUserId === ownerUserId,
              ),
            ),
        },
        memberships,
      },
    },
    state: {
      organizations,
      users,
      sentEmails,
    },
  };
}

test("Membership.create creates immutable tenant roles and permissions", async () => {
  const { Membership } = await loadCore();

  const membership = Membership.create({
    id: "membership_1",
    organizationId: "org_1",
    userId: "user_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
    invitedByUserId: "owner_1",
  });

  assert.equal(membership.ok, true);
  assert.equal(membership.data.role, "employee");
  assert.equal(membership.data.status, "active");
  assert.equal(
    membership.data.allowsPermission("organization:members:read", {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "employee", permissions: ["organization:members:read"] }],
    }),
    true,
  );
  assert.equal(
    membership.data.allowsPermission("organization:roles:write", {
      ownerRoleName: "owner",
      employeeRoles: [{ name: "employee", permissions: ["organization:members:read"] }],
    }),
    false,
  );
  assert.equal(Object.isFrozen(membership.data), true);
});

test("membership use cases invite, accept and list organizations without client organization scope", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const invitedUser = core.User.create({
    id: "member_1",
    email: "member@example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const organization = core.Organization.create({
    id: "org_1",
    ownerUserId: "owner_1",
    name: "Minha empresa",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(invitedUser.ok, true);
  assert.equal(organization.ok, true);
  state.users.set(invitedUser.data.id, invitedUser.data);
  state.organizations.set(organization.data.id, organization.data);

  const ownerContext = core.ExecutionContext.create({
    requestId: "req_invite",
    actor: { type: "user", id: "owner_1" },
    organizationId: "org_1",
  });
  const invite = await new core.InviteOrganizationMemberUseCase(appContext).execute(ownerContext, {
    organizationId: "org_1",
    userId: "member_1",
    role: "employee",
  });

  assert.equal(invite.ok, true);
  assert.equal(invite.data.status, "invited");
  assert.equal(invite.data.invitedByUserId, "owner_1");

  const memberContext = core.ExecutionContext.create({
    requestId: "req_accept",
    actor: { type: "user", id: "member_1" },
  });
  const accepted = await new core.AcceptOrganizationInvitationUseCase(appContext).execute(
    memberContext,
    {
      organizationId: "org_1",
    },
  );
  const listed = await new core.ListUserOrganizationsUseCase(appContext).execute(memberContext, {
    userId: "member_1",
  });

  assert.equal(accepted.ok, true);
  assert.equal(accepted.data.status, "active");
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 1);
  assert.equal(listed.data[0].organization.id, "org_1");
  assert.equal(listed.data[0].membership.role, "employee");
  assert.equal(memberships.entries.length, 1);
  assert.deepEqual(state.sentEmails, [
    {
      kind: "user-invited",
      to: "member@example.com",
      organizationId: "org_1",
      organizationName: "Minha empresa",
      role: "employee",
      invitedUserId: "member_1",
      invitedByUserId: "owner_1",
    },
  ]);
});

test("membership invitation logs an error when the email handler is missing", async () => {
  const { appContext, core, logger, state } = await createMembershipAppContext();
  const invitedUser = core.User.create({
    id: "member_1",
    email: "member@example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const organization = core.Organization.create({
    id: "org_1",
    ownerUserId: "owner_1",
    name: "Minha empresa",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(invitedUser.ok, true);
  assert.equal(organization.ok, true);
  state.users.set(invitedUser.data.id, invitedUser.data);
  state.organizations.set(organization.data.id, organization.data);

  const withoutHandler = {
    ...appContext,
    notifications: {
      email: {},
    },
  };

  const result = await new core.InviteOrganizationMemberUseCase(withoutHandler).execute(
    core.ExecutionContext.create({
      requestId: "req_invite_missing_handler",
      actor: { type: "user", id: "owner_1" },
      organizationId: "org_1",
    }),
    {
      organizationId: "org_1",
      userId: "member_1",
      role: "employee",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(
    logger.entries.some(
      (entry) =>
        entry.level === "error" &&
        entry.message === "Email notification handler is not configured." &&
        entry.context?.handlerName === "sendUserInvitationEmail",
    ),
    true,
  );
});

test("membership invitation logs an error when invited user cannot be resolved", async () => {
  const { appContext, core, logger, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_invited_user_missing",
    ownerUserId: "owner_1",
    name: "Missing invited user org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  const result = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_invited_user_missing",
      actor: { type: "user", id: "owner_1" },
      organizationId: "org_invited_user_missing",
    }),
    {
      organizationId: "org_invited_user_missing",
      userId: "missing_user",
      role: "employee",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(
    logger.entries.some(
      (entry) =>
        entry.level === "error" &&
        entry.message === "Invited user email could not be resolved." &&
        entry.context?.userId === "missing_user",
    ),
    true,
  );
});

test("ListUserOrganizationsUseCase includes organizations owned by the user without persisted membership", async () => {
  const { appContext, core, state } = await createMembershipAppContext();
  const first = core.Organization.create({
    id: "org_1",
    ownerUserId: "owner_1",
    name: "Empresa 1",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const second = core.Organization.create({
    id: "org_2",
    ownerUserId: "owner_1",
    name: "Empresa 2",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  state.organizations.set(first.data.id, first.data);
  state.organizations.set(second.data.id, second.data);

  const ownerContext = core.ExecutionContext.create({
    requestId: "req_owner_list",
    actor: { type: "user", id: "owner_1" },
  });
  const listed = await new core.ListUserOrganizationsUseCase(appContext).execute(ownerContext, {
    userId: "owner_1",
  });

  assert.equal(listed.ok, true);
  assert.deepEqual(
    listed.data.map((entry) => [entry.organization.id, entry.membership.role]),
    [
      ["org_1", "owner"],
      ["org_2", "owner"],
    ],
  );
});

test("membership use cases enforce tenant membership and role boundaries", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const orgOne = core.Organization.create({
    id: "org_1",
    ownerUserId: "owner_1",
    name: "Empresa 1",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const orgTwo = core.Organization.create({
    id: "org_2",
    ownerUserId: "owner_2",
    name: "Empresa 2",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const member = core.Membership.create({
    id: "membership_1",
    organizationId: "org_1",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(orgOne.ok, true);
  assert.equal(orgTwo.ok, true);
  assert.equal(member.ok, true);
  state.organizations.set(orgOne.data.id, orgOne.data);
  state.organizations.set(orgTwo.data.id, orgTwo.data);
  await memberships.save(member.data);

  const memberContext = core.ExecutionContext.create({
    requestId: "req_member",
    actor: { type: "user", id: "member_1" },
    organizationId: "org_1",
  });
  const deniedRoleChange = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    memberContext,
    {
      organizationId: "org_1",
      userId: "member_1",
      role: "employee",
    },
  );
  const deniedTenantLeak = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    memberContext,
    {
      organizationId: "org_2",
      userId: "other_1",
      role: "member",
    },
  );

  assert.equal(deniedRoleChange.ok, false);
  assert.equal(deniedRoleChange.error.kind, "authorization");
  assert.equal(deniedRoleChange.error.code, "membership.permission_denied");
  assert.equal(deniedTenantLeak.ok, false);
  assert.equal(deniedTenantLeak.error.kind, "authorization");
  assert.equal(deniedTenantLeak.error.code, "core.organization_scope_mismatch");
});

test("owner can change roles and remove members but cannot remove the organization owner", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_1",
    ownerUserId: "owner_1",
    name: "Minha empresa",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const member = core.Membership.create({
    id: "membership_1",
    organizationId: "org_1",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });

  assert.equal(organization.ok, true);
  assert.equal(member.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  await memberships.save(member.data);

  const ownerContext = core.ExecutionContext.create({
    requestId: "req_owner",
    actor: { type: "user", id: "owner_1" },
    organizationId: "org_1",
  });
  const promoted = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_1",
      userId: "member_1",
      role: "employee",
    },
  );
  const removed = await new core.RemoveOrganizationMemberUseCase(appContext).execute(ownerContext, {
    organizationId: "org_1",
    userId: "member_1",
  });
  const removeOwner = await new core.RemoveOrganizationMemberUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_1",
      userId: "owner_1",
    },
  );

  assert.equal(promoted.ok, true, JSON.stringify(promoted));
  assert.equal(promoted.data.role, "employee");
  assert.equal(removed.ok, true);
  assert.equal(removed.data.status, "disabled");
  assert.equal(removeOwner.ok, false);
  assert.equal(removeOwner.error.kind, "conflict");
  assert.equal(removeOwner.error.code, "membership.owner_cannot_be_removed");
});

test("custom employee roles can list members but cannot mutate actors", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_custom_roles",
    ownerUserId: "owner_1",
    name: "Custom roles",
    roleConfig: {
      ownerRoleName: "proprietario",
      employeeRoles: [
        {
          name: "manager",
          permissions: ["organization:members:read", "reports:*"],
        },
      ],
    },
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const manager = core.Membership.create({
    id: "membership_manager",
    organizationId: "org_custom_roles",
    userId: "manager_1",
    role: "manager",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(manager.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  await memberships.save(manager.data);
  const managerContext = core.ExecutionContext.create({
    requestId: "req_manager",
    actor: { type: "user", id: "manager_1" },
    organizationId: "org_custom_roles",
  });

  const listed = await new core.ListOrganizationMembersUseCase(appContext).execute(managerContext, {
    organizationId: "org_custom_roles",
  });
  const invite = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    managerContext,
    {
      organizationId: "org_custom_roles",
      userId: "new_actor",
      role: "manager",
    },
  );

  assert.equal(listed.ok, true);
  assert.deepEqual(
    listed.data.map((membership) => membership.userId),
    ["manager_1"],
  );
  assert.equal(invite.ok, false);
  assert.equal(invite.error.code, "membership.permission_denied");
});

test("AcceptOrganizationInvitationUseCase validates actor, invitation presence and pending status", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_accept",
    ownerUserId: "owner_1",
    name: "Accept org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  const systemActorResult = await new core.AcceptOrganizationInvitationUseCase(appContext).execute(
    core.ExecutionContext.create({ requestId: "req_accept_system", actor: { type: "system" } }),
    {
      organizationId: "org_accept",
    },
  );
  assert.equal(systemActorResult.ok, false);
  assert.equal(systemActorResult.error.code, "membership.user_actor_required");

  const missingInvitation = await new core.AcceptOrganizationInvitationUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_accept_missing",
      actor: { type: "user", id: "member_1" },
    }),
    {
      organizationId: "org_accept",
    },
  );
  assert.equal(missingInvitation.ok, false);
  assert.equal(missingInvitation.error.code, "membership.invitation_not_found");

  const activeMembership = core.Membership.create({
    id: "membership_active",
    organizationId: "org_accept",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(activeMembership.ok, true);
  await memberships.save(activeMembership.data);

  const notPending = await new core.AcceptOrganizationInvitationUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_accept_not_pending",
      actor: { type: "user", id: "member_1" },
    }),
    {
      organizationId: "org_accept",
    },
  );
  assert.equal(notPending.ok, false);
  assert.equal(notPending.error.code, "membership.invitation_not_pending");
});

test("AcceptOrganizationInvitationUseCase propagates validation failure from malformed invitation state", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_accept_invalid",
    ownerUserId: "owner_1",
    name: "Accept invalid org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  await memberships.save(
    Object.freeze({
      id: "",
      organizationId: "org_accept_invalid",
      userId: "member_1",
      role: "employee",
      status: "invited",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      allowsPermission: () => false,
      activate(input) {
        return core.Membership.prototype.activate.call(this, input);
      },
    }),
  );

  const result = await new core.AcceptOrganizationInvitationUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_accept_invalid_membership",
      actor: { type: "user", id: "member_1" },
    }),
    {
      organizationId: "org_accept_invalid",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "validation");
});

test("InviteOrganizationMemberUseCase handles owner role, unknown role and existing membership conflicts", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_invite",
    ownerUserId: "owner_1",
    name: "Invite org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  const ownerContext = core.ExecutionContext.create({
    requestId: "req_invite_owner",
    actor: { type: "user", id: "owner_1" },
    organizationId: "org_invite",
  });

  const ownerRole = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_invite",
      userId: "member_1",
      role: "owner",
    },
  );
  assert.equal(ownerRole.ok, false);
  assert.equal(ownerRole.error.code, "membership.owner_invitation_forbidden");

  const unknownRole = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_invite",
      userId: "member_1",
      role: "manager",
    },
  );
  assert.equal(unknownRole.ok, false);
  assert.equal(unknownRole.error.code, "membership.role_not_found");

  const existing = core.Membership.create({
    id: "membership_existing",
    organizationId: "org_invite",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(existing.ok, true);
  await memberships.save(existing.data);

  const conflict = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_invite",
      userId: "member_1",
      role: "employee",
    },
  );
  assert.equal(conflict.ok, false);
  assert.equal(conflict.error.code, "membership.already_exists");
});

test("InviteOrganizationMemberUseCase allows re-inviting a previously disabled membership", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const invitedUser = core.User.create({
    id: "member_reinvite",
    email: "member-reinvite@example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const organization = core.Organization.create({
    id: "org_reinvite",
    ownerUserId: "owner_1",
    name: "Reinvite org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const disabledMembership = core.Membership.create({
    id: "membership_disabled",
    organizationId: "org_reinvite",
    userId: "member_reinvite",
    role: "employee",
    status: "disabled",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(invitedUser.ok, true);
  assert.equal(organization.ok, true);
  assert.equal(disabledMembership.ok, true);
  state.users.set(invitedUser.data.id, invitedUser.data);
  state.organizations.set(organization.data.id, organization.data);
  await memberships.save(disabledMembership.data);

  const result = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_reinvite",
      actor: { type: "user", id: "owner_1" },
      organizationId: "org_reinvite",
    }),
    {
      organizationId: "org_reinvite",
      userId: "member_reinvite",
      role: "employee",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.status, "invited");
  assert.equal(state.sentEmails.length, 1);
});

test("role and remove use cases return not found and owner protection failures", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_manage",
    ownerUserId: "owner_1",
    name: "Manage org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  const ownerContext = core.ExecutionContext.create({
    requestId: "req_manage_owner",
    actor: { type: "user", id: "owner_1" },
    organizationId: "org_manage",
  });

  const changeMissing = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_manage",
      userId: "missing_user",
      role: "employee",
    },
  );
  assert.equal(changeMissing.ok, false);
  assert.equal(changeMissing.error.code, "membership.not_found");

  const removeMissing = await new core.RemoveOrganizationMemberUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_manage",
      userId: "missing_user",
    },
  );
  assert.equal(removeMissing.ok, false);
  assert.equal(removeMissing.error.code, "membership.not_found");

  const ownerMembership = core.Membership.create({
    id: "membership_owner_manage",
    organizationId: "org_manage",
    userId: "owner_1",
    role: "owner",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(ownerMembership.ok, true);
  await memberships.save(ownerMembership.data);

  const ownerRoleConflict = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_manage",
      userId: "owner_1",
      role: "employee",
    },
  );
  assert.equal(ownerRoleConflict.ok, false);
  assert.equal(ownerRoleConflict.error.code, "membership.owner_role_required");
});

test("ListUserOrganizationsUseCase enforces actor-user match and filters orphan memberships", async () => {
  const { appContext, core, memberships } = await createMembershipAppContext();
  const activeMembership = core.Membership.create({
    id: "membership_orphan",
    organizationId: "org_missing",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(activeMembership.ok, true);
  await memberships.save(activeMembership.data);

  const mismatch = await new core.ListUserOrganizationsUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_list_mismatch",
      actor: { type: "user", id: "owner_1" },
    }),
    { userId: "member_1" },
  );
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.error.code, "core.actor_user_mismatch");

  const listed = await new core.ListUserOrganizationsUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_list_member",
      actor: { type: "user", id: "member_1" },
    }),
    { userId: "member_1" },
  );
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 0);
});

test("InviteOrganizationMemberUseCase allows system actor and omits invitedByUserId in notification", async () => {
  const { appContext, core, state } = await createMembershipAppContext();
  const invitedUser = core.User.create({
    id: "member_system",
    email: "member-system@example.com",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const organization = core.Organization.create({
    id: "org_system_invite",
    ownerUserId: "owner_1",
    name: "System invite org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(invitedUser.ok, true);
  assert.equal(organization.ok, true);
  state.users.set(invitedUser.data.id, invitedUser.data);
  state.organizations.set(organization.data.id, organization.data);

  const result = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_system_invite",
      actor: { type: "system" },
      organizationId: "org_system_invite",
    }),
    {
      organizationId: "org_system_invite",
      userId: "member_system",
      role: "employee",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.invitedByUserId, undefined);
  assert.deepEqual(state.sentEmails, [
    {
      kind: "user-invited",
      to: "member-system@example.com",
      organizationId: "org_system_invite",
      organizationName: "System invite org",
      role: "employee",
      invitedUserId: "member_system",
    },
  ]);
});

test("membership permission checks reject service actors and unknown configured roles", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_service_actor",
    ownerUserId: "owner_1",
    name: "Service actor org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const member = core.Membership.create({
    id: "membership_service_target",
    organizationId: "org_service_actor",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(member.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  await memberships.save(member.data);

  const serviceActor = core.ExecutionContext.create({
    requestId: "req_service_actor",
    actor: { type: "service", id: "svc_1" },
    organizationId: "org_service_actor",
  });

  const inviteDenied = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    serviceActor,
    {
      organizationId: "org_service_actor",
      userId: "member_2",
      role: "employee",
    },
  );
  assert.equal(inviteDenied.ok, false);
  assert.equal(inviteDenied.error.code, "membership.user_actor_required");

  const roleNotFound = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_unknown_role",
      actor: { type: "user", id: "owner_1" },
      organizationId: "org_service_actor",
    }),
    {
      organizationId: "org_service_actor",
      userId: "member_1",
      role: "manager",
    },
  );
  assert.equal(roleNotFound.ok, false);
  assert.equal(roleNotFound.error.code, "membership.role_not_found");
});

test("InviteOrganizationMemberUseCase propagates membership validation failures for invalid input payloads", async () => {
  const { appContext, core, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_invite_validation",
    ownerUserId: "owner_1",
    name: "Invite validation org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  const result = await new core.InviteOrganizationMemberUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_invite_invalid_payload",
      actor: { type: "user", id: "owner_1" },
      organizationId: "org_invite_validation",
    }),
    {
      organizationId: "org_invite_validation",
      userId: "   ",
      role: "employee",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "validation");
});

test("RemoveOrganizationMemberUseCase denies actors without remove permission", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_remove_permission",
    ownerUserId: "owner_1",
    name: "Remove permission org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  const member = core.Membership.create({
    id: "membership_remove_permission",
    organizationId: "org_remove_permission",
    userId: "member_1",
    role: "employee",
    status: "active",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  assert.equal(member.ok, true);
  state.organizations.set(organization.data.id, organization.data);
  await memberships.save(member.data);

  const denied = await new core.RemoveOrganizationMemberUseCase(appContext).execute(
    core.ExecutionContext.create({
      requestId: "req_remove_denied",
      actor: { type: "user", id: "member_1" },
      organizationId: "org_remove_permission",
    }),
    {
      organizationId: "org_remove_permission",
      userId: "member_1",
    },
  );

  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "membership.permission_denied");
});

test("ListUserOrganizationsUseCase works when owner listing repository is unavailable", async () => {
  const { appContext, core } = await createMembershipAppContext();
  const result = await new core.ListUserOrganizationsUseCase({
    ...appContext,
    repositories: {
      ...appContext.repositories,
      organizations: {
        save: appContext.repositories.organizations.save,
        findById: appContext.repositories.organizations.findById,
      },
    },
  }).execute(
    core.ExecutionContext.create({
      requestId: "req_no_owner_list_repo",
      actor: { type: "user", id: "owner_1" },
    }),
    { userId: "owner_1" },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, []);
});

test("membership mutation use cases return organization not found when tenant does not exist", async () => {
  const { appContext, core } = await createMembershipAppContext();
  const ownerContext = core.ExecutionContext.create({
    requestId: "req_missing_org",
    actor: { type: "user", id: "owner_1" },
    organizationId: "org_missing",
  });

  const invite = await new core.InviteOrganizationMemberUseCase(appContext).execute(ownerContext, {
    organizationId: "org_missing",
    userId: "member_1",
    role: "employee",
  });
  const changeRole = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_missing",
      userId: "member_1",
      role: "employee",
    },
  );
  const remove = await new core.RemoveOrganizationMemberUseCase(appContext).execute(ownerContext, {
    organizationId: "org_missing",
    userId: "member_1",
  });

  assert.equal(invite.ok, false);
  assert.equal(invite.error.code, "organization.not_found");
  assert.equal(changeRole.ok, false);
  assert.equal(changeRole.error.code, "organization.not_found");
  assert.equal(remove.ok, false);
  assert.equal(remove.error.code, "organization.not_found");
});

test("membership mutation use cases propagate validation failures from malformed persisted memberships", async () => {
  const { appContext, core, memberships, state } = await createMembershipAppContext();
  const organization = core.Organization.create({
    id: "org_invalid_membership",
    ownerUserId: "owner_1",
    name: "Invalid membership org",
    createdAt: "2026-06-18T12:00:00.000Z",
  });
  assert.equal(organization.ok, true);
  state.organizations.set(organization.data.id, organization.data);

  await memberships.save(
    Object.freeze({
      id: "",
      organizationId: "org_invalid_membership",
      userId: "member_1",
      role: "employee",
      status: "active",
      createdAt: "2026-06-18T12:00:00.000Z",
      updatedAt: "2026-06-18T12:00:00.000Z",
      allowsPermission: () => true,
      changeRole(input) {
        return core.Membership.prototype.changeRole.call(this, input);
      },
      disable(input) {
        return core.Membership.prototype.disable.call(this, input);
      },
    }),
  );

  const ownerContext = core.ExecutionContext.create({
    requestId: "req_invalid_membership",
    actor: { type: "user", id: "owner_1" },
    organizationId: "org_invalid_membership",
  });

  const roleChange = await new core.ChangeOrganizationMemberRoleUseCase(appContext).execute(
    ownerContext,
    {
      organizationId: "org_invalid_membership",
      userId: "member_1",
      role: "employee",
    },
  );
  const removal = await new core.RemoveOrganizationMemberUseCase(appContext).execute(ownerContext, {
    organizationId: "org_invalid_membership",
    userId: "member_1",
  });

  assert.equal(roleChange.ok, false);
  assert.equal(roleChange.error.kind, "validation");
  assert.equal(removal.ok, false);
  assert.equal(removal.error.kind, "validation");
});
