import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const requiredModelNames = [
  "User",
  "FederatedIdentity",
  "UserCredentials",
  "PasswordResetToken",
  "Organization",
  "Membership",
  "Customer",
  "Plan",
  "Subscription",
  "BillingEvent",
  "AuditEvent",
  "WebhookEvent",
] as const;

const requiredSchemaPatterns: ReadonlyArray<Readonly<{ label: string; pattern: RegExp }>> = [
  {
    label: 'datasource "db" com "provider" definido',
    pattern: /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"[^"]+"[\s\S]*?\}/m,
  },
  {
    label: "unicidade de webhook por provider/evento",
    pattern:
      /model\s+WebhookEvent\s*\{[\s\S]*?@@unique\s*\(\s*\[\s*provider\s*,\s*providerEventId\s*]\s*\)/m,
  },
  {
    label: "unicidade de plano por organization/code",
    pattern: /model\s+Plan\s*\{[\s\S]*?@@unique\s*\(\s*\[\s*organizationId\s*,\s*code\s*]\s*\)/m,
  },
];

export type ValidatePrismaSchemaContractInput = Readonly<{
  schemaPath?: string;
  schemaSource?: string;
}>;

export type PrismaSchemaContractValidationResult = Readonly<{
  isValid: boolean;
  schemaPath: string;
  issues: ReadonlyArray<string>;
}>;

/** Resolves the canonical Prisma schema path published with this package. */
export function resolvePackagedPrismaSchemaPath(): string {
  return resolve(fileURLToPath(new URL("../../../prisma/schema.prisma", import.meta.url)));
}

/**
 * Validates that a Prisma schema exists and includes the minimum contract required by this adapter.
 */
export async function validatePrismaSchemaContract(
  input: ValidatePrismaSchemaContractInput = {},
): Promise<PrismaSchemaContractValidationResult> {
  const schemaPath = resolve(input.schemaPath ?? "prisma/schema.prisma");
  const issues: string[] = [];

  const schemaSource =
    input.schemaSource ??
    (await readSchemaFromDisk(schemaPath).catch(() => {
      issues.push(
        `Schema nao encontrado em ${schemaPath}. Crie o arquivo ou copie o schema canonico do package.`,
      );
      return undefined;
    }));

  if (schemaSource === undefined) {
    return { isValid: false, schemaPath, issues };
  }

  for (const modelName of requiredModelNames) {
    if (!new RegExp(`\\bmodel\\s+${modelName}\\s*\\{`, "m").test(schemaSource)) {
      issues.push(`Model obrigatorio ausente: ${modelName}.`);
    }
  }

  for (const schemaPattern of requiredSchemaPatterns) {
    if (!schemaPattern.pattern.test(schemaSource)) {
      issues.push(`Regra obrigatoria ausente: ${schemaPattern.label}.`);
    }
  }

  return { isValid: issues.length === 0, schemaPath, issues };
}

/**
 * Asserts Prisma schema compatibility. Throws with actionable guidance when validation fails.
 */
export async function assertPrismaSchemaContract(
  input: ValidatePrismaSchemaContractInput = {},
): Promise<void> {
  const result = await validatePrismaSchemaContract(input);
  if (result.isValid) {
    return;
  }

  throw new Error(
    [
      `Prisma schema contract is invalid at ${result.schemaPath}.`,
      ...result.issues.map((issue) => `- ${issue}`),
      `Reference schema: ${resolvePackagedPrismaSchemaPath()}`,
    ].join("\n"),
  );
}

async function readSchemaFromDisk(schemaPath: string): Promise<string> {
  await access(schemaPath);
  return readFile(schemaPath, "utf8");
}
