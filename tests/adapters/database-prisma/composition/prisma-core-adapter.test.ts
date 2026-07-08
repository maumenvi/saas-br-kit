import assert from "node:assert/strict";
import test from "node:test";
import { coreProperties, SaasBrCore } from "#core";
import { prismaCoreAdapter } from "../../../../src/adapters/database-prisma/composition/prisma-core-adapter.ts";
import { makeClient } from "../support.ts";

test("registers Prisma database, transactions, repositories and shared context ports", async () => {
  const application = await SaasBrCore.create()
    .add(coreProperties())
    .add(prismaCoreAdapter({ client: makeClient() }))
    .build();

  const output = application.outputs.prisma;
  assert.equal(application.appContext.adapters.database, output.database);
  assert.equal(application.appContext.transactionManager, output.database.transactionManager);
  assert.equal(
    application.appContext.repositories.organizations,
    output.repositories.organizations,
  );
  assert.equal(application.appContext.tenantAccess.memberships, output.repositories.memberships);
  assert.equal(Object.isFrozen(application.appContext.tenantAccess), true);
});
