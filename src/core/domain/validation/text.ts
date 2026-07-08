import { fail, ok, type Result } from "../../errors/result.ts";
import { domainErrorFactory } from "./errors.ts";

/**
 * Normalizes required and optional text fields for domain entities.
 */
export class TextNormalizer {
  /**
   * Trims a required text value and enforces length boundaries.
   */
  required(
    field: string,
    value: string,
    limits: Readonly<{ minLength?: number; maxLength: number }>,
  ): Result<string> {
    const normalized = value.trim();
    const minLength = limits.minLength ?? 1;

    if (normalized.length < minLength || normalized.length > limits.maxLength) {
      return fail(
        domainErrorFactory.validation(
          `${field}.invalid`,
          `${field} must have between ${minLength} and ${limits.maxLength} characters.`,
          { minLength, maxLength: limits.maxLength },
        ),
      );
    }

    return ok(normalized);
  }

  /**
   * Trims an optional text value when present and keeps missing values undefined.
   */
  optional(
    field: string,
    value: string | undefined,
    limits: Readonly<{ minLength?: number; maxLength: number }>,
  ): Result<string | undefined> {
    if (value === undefined) {
      return ok(undefined);
    }

    return this.required(field, value, limits);
  }
}

/** Shared text normalizer used by domain factories. */
export const textNormalizer = new TextNormalizer();

/** Compatibility facade for required text normalization. */
export const normalizeRequiredText = (
  field: string,
  value: string,
  limits: Readonly<{ minLength?: number; maxLength: number }>,
): Result<string> => textNormalizer.required(field, value, limits);

/** Compatibility facade for optional text normalization. */
export const normalizeOptionalText = (
  field: string,
  value: string | undefined,
  limits: Readonly<{ minLength?: number; maxLength: number }>,
): Result<string | undefined> => textNormalizer.optional(field, value, limits);
