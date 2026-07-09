import { CORE_ERROR_KINDS, type CoreErrorKind } from "../core/index.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  type SchemaValidationIssue,
  valid,
  validateEnum,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type CoreErrorKindDto = CoreErrorKind;

export type CoreErrorDto = Readonly<{
  kind: CoreErrorKindDto;
  code: string;
  message: string;
  details?: Readonly<Record<string, unknown>>;
  retryable?: boolean;
}>;

export const coreErrorKindSchema = new ContractSchema<CoreErrorKindDto>(
  "coreErrorKind",
  (value, path) => validateEnum(value, path, CORE_ERROR_KINDS),
);

export const coreErrorSchema = new ContractSchema<CoreErrorDto>("coreError", (value, path) => {
  if (!isPlainRecord(value)) {
    return invalid(path, "Expected core error object.");
  }

  const issues: SchemaValidationIssue[] = [];
  const kind = coreErrorKindSchema.validate(value.kind, [...path, "kind"]);
  const code = validateNonEmptyString(value.code, [...path, "code"]);
  const message = validateNonEmptyString(value.message, [...path, "message"]);

  for (const result of [kind, code, message]) {
    if (!result.ok) {
      issues.push(...result.issues);
    }
  }

  if (value.details !== undefined && !isPlainRecord(value.details)) {
    issues.push({ path: [...path, "details"], message: "Expected details object." });
  }

  if (value.retryable !== undefined && typeof value.retryable !== "boolean") {
    issues.push({ path: [...path, "retryable"], message: "Expected boolean retryable flag." });
  }

  if (issues.length > 0 || !kind.ok || !code.ok || !message.ok) {
    return { ok: false, issues };
  }

  return valid(
    Object.freeze({
      kind: kind.value,
      code: code.value,
      message: message.value,
      ...(value.details === undefined ? {} : { details: Object.freeze({ ...value.details }) }),
      ...(value.retryable === undefined ? {} : { retryable: value.retryable as boolean }),
    }),
  );
});
