export type SchemaValidationIssue = Readonly<{
  path: readonly string[];
  message: string;
}>;

export type SchemaValidationResult<TValue> =
  | Readonly<{ ok: true; value: TValue }>
  | Readonly<{ ok: false; issues: readonly SchemaValidationIssue[] }>;

export type ContractValidator<TValue> = (
  value: unknown,
  path: readonly string[],
) => SchemaValidationResult<TValue>;

/**
 * Error raised when a contract schema parse operation receives invalid data.
 */
export class ContractSchemaValidationError extends Error {
  /** Validation issues with field paths and messages. */
  public readonly issues: readonly SchemaValidationIssue[];

  /** Stores validation issues and exposes a readable error message. */
  constructor(schemaName: string, issues: readonly SchemaValidationIssue[]) {
    super(`${schemaName} validation failed.`);
    this.name = "ContractSchemaValidationError";
    this.issues = Object.freeze([...issues]);
  }
}

/**
 * Dependency-free schema object used by public DTO contracts.
 */
export class ContractSchema<TValue> {
  /** Schema name used in parse errors. */
  public readonly name: string;

  private readonly validator: ContractValidator<TValue>;

  /** Stores the schema name and validator implementation. */
  constructor(name: string, validator: ContractValidator<TValue>) {
    this.name = name;
    this.validator = validator;
  }

  /**
   * Validates data and returns a success/failure result without throwing.
   */
  validate(value: unknown, path: readonly string[] = []): SchemaValidationResult<TValue> {
    return this.validator(value, path);
  }

  /**
   * Validates data and throws when the value does not match the contract.
   */
  parse(value: unknown): TValue {
    const result = this.validate(value);
    if (result.ok) {
      return result.value;
    }

    throw new ContractSchemaValidationError(this.name, result.issues);
  }
}

export function validateSchema<TValue>(
  schema: ContractSchema<TValue>,
  value: unknown,
): SchemaValidationResult<TValue> {
  return schema.validate(value);
}

export function valid<TValue>(value: TValue): SchemaValidationResult<TValue> {
  return { ok: true, value };
}

export function invalid(path: readonly string[], message: string): SchemaValidationResult<never> {
  return { ok: false, issues: [{ path, message }] };
}

export function mergeValidationIssues(
  results: readonly SchemaValidationResult<unknown>[],
): readonly SchemaValidationIssue[] {
  return Object.freeze(results.flatMap((result) => (result.ok ? [] : result.issues)));
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateNonEmptyString(
  value: unknown,
  path: readonly string[],
): SchemaValidationResult<string> {
  return isNonEmptyString(value) ? valid(value) : invalid(path, "Expected a non-empty string.");
}

export function validateIntegerPositiveSafe(
  value: unknown,
  path: readonly string[],
): SchemaValidationResult<number> {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isSafeInteger(value) &&
    value > 0
    ? valid(value)
    : invalid(path, "Expected a positive safe integer.");
}

export function validateIsoDateTime(
  value: unknown,
  path: readonly string[],
): SchemaValidationResult<string> {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value))
    ? valid(value)
    : invalid(path, "Expected an ISO datetime string.");
}

export function validateEmail(
  value: unknown,
  path: readonly string[],
): SchemaValidationResult<string> {
  return isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? valid(value)
    : invalid(path, "Expected a valid email.");
}

export function validateEnum<TValue extends string>(
  value: unknown,
  path: readonly string[],
  allowed: readonly TValue[],
): SchemaValidationResult<TValue> {
  return typeof value === "string" && allowed.includes(value as TValue)
    ? valid(value as TValue)
    : invalid(path, `Expected one of: ${allowed.join(", ")}.`);
}

export function validateLiteral<TValue extends string | number | boolean | null>(
  value: unknown,
  path: readonly string[],
  expected: TValue,
): SchemaValidationResult<TValue> {
  return value === expected
    ? valid(expected)
    : invalid(path, `Expected literal ${String(expected)}.`);
}
