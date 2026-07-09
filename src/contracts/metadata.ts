import {
  ContractSchema,
  invalid,
  isPlainRecord,
  type SchemaValidationIssue,
  valid,
} from "./schema-validation.ts";

export type SafeMetadataPrimitiveDto = string | number | boolean | null;

export type SafeMetadataValueDto =
  | SafeMetadataPrimitiveDto
  | SafeMetadataDto
  | readonly SafeMetadataValueDto[];

export interface SafeMetadataDto {
  readonly [key: string]: SafeMetadataValueDto;
}

export const safeMetadataValueSchema = new ContractSchema<SafeMetadataValueDto>(
  "safeMetadataValue",
  (value, path) => validateSafeMetadataValue(value, path),
);

export const safeMetadataSchema = new ContractSchema<SafeMetadataDto>(
  "safeMetadata",
  (value, path) => validateSafeMetadataObject(value, path),
);

function validateSafeMetadataValue(
  value: unknown,
  path: readonly string[],
): import("./schema-validation.ts").SchemaValidationResult<SafeMetadataValueDto> {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return valid(value);
  }

  if (Array.isArray(value)) {
    const issues: SchemaValidationIssue[] = [];
    const output: SafeMetadataValueDto[] = [];
    for (const [index, item] of value.entries()) {
      const itemResult = validateSafeMetadataValue(item, [...path, String(index)]);
      if (itemResult.ok) {
        output.push(itemResult.value);
      } else {
        issues.push(...itemResult.issues);
      }
    }
    return issues.length === 0 ? valid(Object.freeze(output)) : { ok: false, issues };
  }

  if (isPlainRecord(value)) {
    return validateSafeMetadataObject(value, path);
  }

  return invalid(path, "Expected a JSON-compatible metadata value.");
}

function validateSafeMetadataObject(
  value: unknown,
  path: readonly string[],
): import("./schema-validation.ts").SchemaValidationResult<SafeMetadataDto> {
  if (!isPlainRecord(value)) {
    return invalid(path, "Expected metadata object.");
  }

  const issues: SchemaValidationIssue[] = [];
  const output: Record<string, SafeMetadataValueDto> = {};
  for (const [key, item] of Object.entries(value)) {
    const itemResult = validateSafeMetadataValue(item, [...path, key]);
    if (itemResult.ok) {
      output[key] = itemResult.value;
    } else {
      issues.push(...itemResult.issues);
    }
  }

  return issues.length === 0 ? valid(Object.freeze(output)) : { ok: false, issues };
}
