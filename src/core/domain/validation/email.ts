import { fail, ok, type Result } from "../../errors/result.ts";
import { domainErrorFactory } from "./errors.ts";
import { textNormalizer } from "./text.ts";

/**
 * Normalizes email identity fields without external validation dependencies.
 */
export class EmailNormalizer {
  /**
   * Trims, lowercases and validates the minimal email contract used by the Core.
   */
  normalize(field: string, value: string): Result<string> {
    const text = textNormalizer.required(field, value, { maxLength: 254 });
    if (!text.ok) {
      return text;
    }

    const email = text.data.toLowerCase();
    const atIndex = email.indexOf("@");
    const hasSingleAt = atIndex > 0 && atIndex === email.lastIndexOf("@");
    const hasDomainDot = email.slice(atIndex + 1).includes(".");

    if (!hasSingleAt || !hasDomainDot) {
      return fail(
        domainErrorFactory.validation(`${field}.invalid`, `${field} must be a valid email.`),
      );
    }

    return ok(email);
  }
}

/** Shared email normalizer used by auth and user domain classes. */
export const emailNormalizer = new EmailNormalizer();

/** Compatibility facade for email normalization. */
export const normalizeEmail = (field: string, value: string): Result<string> =>
  emailNormalizer.normalize(field, value);
