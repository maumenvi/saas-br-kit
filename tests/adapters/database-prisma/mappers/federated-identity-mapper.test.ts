import assert from "node:assert/strict";
import test from "node:test";
import { prismaFederatedIdentityMapper } from "../../../../src/adapters/database-prisma/mappers/federated-identity-mapper.ts";
import { laterTimestamp, makeFederatedIdentity, timestamp } from "../support.ts";

test("maps federated identity issuer and subject without using email as key", () => {
  const identity = makeFederatedIdentity();
  const row = prismaFederatedIdentityMapper.toPersistence(identity);

  assert.deepEqual(row, {
    id: "federated_identity_1",
    userId: "user_1",
    providerId: "google",
    issuer: "https://accounts.google.com",
    subject: "google_subject_1",
    email: "user@example.com",
    createdAt: new Date(timestamp),
    updatedAt: new Date(laterTimestamp),
  });
  assert.deepEqual(prismaFederatedIdentityMapper.toDomain(row), identity);
});
