import assert from "node:assert/strict";
import test from "node:test";
import { prismaFederatedIdentityMapper } from "../../../../src/adapters/database-prisma/mappers/federated-identity-mapper.ts";
import { prismaDatabaseAdapter } from "../../../../src/adapters/database-prisma/prisma-database-adapter.ts";
import { PrismaRepositoryContext } from "../../../../src/adapters/database-prisma/repositories/context.ts";
import { PrismaFederatedIdentityRepository } from "../../../../src/adapters/database-prisma/repositories/federated-identity-repository.ts";
import { makeClient, makeDelegate, makeFederatedIdentity } from "../support.ts";

test("saves and queries federated identities by stable provider coordinates", async () => {
  const identity = makeFederatedIdentity();
  const delegate = makeDelegate({
    findUnique: async () => prismaFederatedIdentityMapper.toPersistence(identity),
  });
  const context = new PrismaRepositoryContext(
    prismaDatabaseAdapter(makeClient({ federatedIdentity: delegate })),
  );
  const repository = new PrismaFederatedIdentityRepository(context);

  await repository.save(identity);
  assert.deepEqual(
    await repository.findByIssuerAndSubject({
      issuer: identity.issuer,
      subject: identity.subject,
    }),
    identity,
  );
  assert.deepEqual(
    await repository.findByUserIdAndIssuer({
      userId: identity.userId,
      issuer: identity.issuer,
    }),
    identity,
  );
});
