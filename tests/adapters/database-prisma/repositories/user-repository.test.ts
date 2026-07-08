import assert from "node:assert/strict";
import test from "node:test";
import {
  prismaUserCredentialsMapper,
  prismaUserMapper,
} from "../../../../src/adapters/database-prisma/mappers/user-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import {
  PrismaUserCredentialsRepository,
  PrismaUserRepository,
} from "../../../../src/adapters/database-prisma/repositories/user-repository.ts";
import { makeClient, makeDelegate, makeUser, makeUserCredentials } from "../support.ts";

test("saves and queries actors and credential hashes", async () => {
  const user = makeUser();
  const credentials = makeUserCredentials();
  const userDelegate = makeDelegate({
    findUnique: async () => prismaUserMapper.toPersistence(user),
    findMany: async () => [prismaUserMapper.toPersistence(user)],
  });
  const credentialsDelegate = makeDelegate({
    findUnique: async () => prismaUserCredentialsMapper.toPersistence(credentials),
  });
  const context = new PrismaRepositoryContext(
    prismaDatabaseAdapter(makeClient({ user: userDelegate, userCredentials: credentialsDelegate })),
  );
  const users = new PrismaUserRepository(context);
  const userCredentials = new PrismaUserCredentialsRepository(context);
  await users.save(user);
  await userCredentials.save(credentials);
  assert.deepEqual(await users.findById(user.id), user);
  assert.deepEqual(await users.findByEmail(user.email), user);
  assert.deepEqual(await users.list(), [user]);
  assert.deepEqual(await userCredentials.findByEmail(credentials.email), credentials);
});
