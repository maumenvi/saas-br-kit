import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPrismaSchemaContract,
  resolvePackagedPrismaSchemaPath,
  validatePrismaSchemaContract,
} from "../../../src/adapters/database-prisma/prisma-schema-contract.ts";

test("validates the packaged Prisma schema as contract-compliant", async () => {
  const schemaPath = resolvePackagedPrismaSchemaPath();

  const result = await validatePrismaSchemaContract({ schemaPath });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.issues, []);
});

test("reports missing schema files", async () => {
  const result = await validatePrismaSchemaContract({
    schemaPath: "prisma/does-not-exist.prisma",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.issues.length > 0, true);
  assert.equal(result.issues[0]?.includes("Schema nao encontrado"), true);
});

test("reports missing required models from inline schema source", async () => {
  const result = await validatePrismaSchemaContract({
    schemaSource: `
generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "postgresql"
}
`,
  });

  assert.equal(result.isValid, false);
  assert.equal(
    result.issues.some((issue) => issue.includes("Model obrigatorio ausente: User.")),
    true,
  );
  assert.equal(
    result.issues.some((issue) =>
      issue.includes("Regra obrigatoria ausente: unicidade de webhook"),
    ),
    true,
  );
});

test("throws with actionable guidance when schema contract is invalid", async () => {
  await assert.rejects(
    () => assertPrismaSchemaContract({ schemaPath: "prisma/does-not-exist.prisma" }),
    (error: unknown) => {
      assert.equal(error instanceof Error, true);
      assert.equal(
        error instanceof Error && error.message.includes("Prisma schema contract is invalid"),
        true,
      );
      assert.equal(error instanceof Error && error.message.includes("Reference schema:"), true);
      return true;
    },
  );
});
