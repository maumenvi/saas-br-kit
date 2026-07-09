import assert from "node:assert/strict";
import test from "node:test";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaPasswordResetTokenRepository } from "../../../../src/adapters/database-prisma/repositories/password-reset-token-repository.ts";
import { makeClient, makeDelegate, timestamp } from "../support.ts";

test("saves and finds password reset tokens without exposing a plaintext secret", async () => {
  const record = Object.freeze({
    id: "reset_1",
    userId: "user_1",
    secretHash: "hash:reset-token",
    expiresAt: "2026-01-03T03:04:05.000Z",
    createdAt: timestamp,
  });
  const delegate = makeDelegate({
    findUnique: async () => ({
      ...record,
      expiresAt: new Date(record.expiresAt),
      createdAt: new Date(record.createdAt),
      consumedAt: null,
    }),
  });
  const context = new PrismaRepositoryContext(
    prismaDatabaseAdapter(makeClient({ passwordResetToken: delegate })),
  );
  const repository = new PrismaPasswordResetTokenRepository(context);

  await repository.save(record);
  assert.deepEqual(await repository.findBySecretHash(record.secretHash), record);
});
