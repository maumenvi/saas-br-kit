import { fail, ok, type Result } from "../../errors/result.ts";
import { domainErrorFactory } from "./errors.ts";

export type TimestampInput = string | Date;

/**
 * Normalizes timestamp inputs to valid ISO-compatible strings.
 */
export class TimestampNormalizer {
  /**
   * Converts a Date or string to a validated timestamp string.
   */
  required(field: string, value: TimestampInput): Result<string> {
    if (typeof value !== "string" && Number.isNaN(value.getTime())) {
      return fail(
        domainErrorFactory.validation(`${field}.invalid`, `${field} must be a valid timestamp.`),
      );
    }

    const timestamp = typeof value === "string" ? value : value.toISOString();

    if (timestamp.trim().length === 0 || Number.isNaN(Date.parse(timestamp))) {
      return fail(
        domainErrorFactory.validation(`${field}.invalid`, `${field} must be a valid timestamp.`),
      );
    }

    return ok(timestamp);
  }

  /**
   * Converts an optional timestamp when present and keeps missing values undefined.
   */
  optional(field: string, value: TimestampInput | undefined): Result<string | undefined> {
    if (value === undefined) {
      return ok(undefined);
    }

    return this.required(field, value);
  }
}

/** Shared timestamp normalizer used by domain factories. */
export const timestampNormalizer = new TimestampNormalizer();

/** Compatibility facade for required timestamp normalization. */
export const normalizeTimestamp = (field: string, value: TimestampInput): Result<string> =>
  timestampNormalizer.required(field, value);

/** Compatibility facade for optional timestamp normalization. */
export const normalizeOptionalTimestamp = (
  field: string,
  value: TimestampInput | undefined,
): Result<string | undefined> => timestampNormalizer.optional(field, value);
