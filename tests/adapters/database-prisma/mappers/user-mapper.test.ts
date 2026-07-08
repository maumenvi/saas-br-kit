import assert from "node:assert/strict";
import test from "node:test";
import {
  prismaUserCredentialsMapper,
  prismaUserMapper,
} from "../../../../src/adapters/database-prisma/mappers/user-mapper.ts";
import { laterTimestamp, makeUser, makeUserCredentials, timestamp } from "../support.ts";

test("maps actors and password credential hashes", () => {
  const user = makeUser();
  const credentials = makeUserCredentials();
  const userRow = prismaUserMapper.toPersistence(user);
  const credentialsRow = prismaUserCredentialsMapper.toPersistence(credentials);
  assert.deepEqual(userRow, {
    id: "user_1",
    email: "user@example.com",
    displayName: "User Example",
    status: "active",
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });
  assert.equal(credentialsRow.passwordHash, "scrypt$salt$hash");
  assert.deepEqual(prismaUserMapper.toDomain(userRow), user);
  assert.deepEqual(prismaUserCredentialsMapper.toDomain(credentialsRow), credentials);
});
