import assert from "node:assert/strict";
import test from "node:test";
import { clock, idGenerator, logger, SaasBrCore } from "#core";
import { prismaCoreAdapter } from "../../../../src/adapters/database-prisma/composition/prisma-core-adapter.ts";
import {
  createFixedClock,
  createNoopLogger,
  createSequentialIdGenerator,
} from "../../../../src/testing/index.ts";
import { makeClient } from "../support.ts";

test("registers Prisma database, transactions, repositories and shared context ports", async () => {
  const application = await SaasBrCore.create()
    .add(clock(createFixedClock(new Date("2026-06-18T00:00:00.000Z"))))
    .add(logger(createNoopLogger()))
    .add(idGenerator(createSequentialIdGenerator("prisma")))
    .adapters.add(prismaCoreAdapter({ client: makeClient() }))
    .build();

  const output = application.outputs.prisma;
  assert.equal(application.appContext.adapters.database, output.database);
  assert.equal(application.appContext.transactionManager, output.database.transactionManager);
  assert.equal(
    application.appContext.repositories.organizations,
    output.repositories.organizations,
  );
  assert.equal(application.appContext.tenantAccess.memberships, output.repositories.memberships);
  assert.equal(application.appContext.auth.users, output.repositories.users);
  assert.equal(application.appContext.auth.userCredentials, output.repositories.userCredentials);
  assert.equal(Object.isFrozen(application.appContext.tenantAccess), true);
});
