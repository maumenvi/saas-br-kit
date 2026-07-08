import { fail, ok, type Result } from "../../errors/result.ts";
import { domainErrorFactory } from "./errors.ts";

/**
 * Validates string values against a closed set of domain-supported options.
 */
export class AllowedStringPolicy {
  /**
   * Returns the typed value when it belongs to the allowed list.
   */
  ensure<TValue extends string>(
    field: string,
    value: string,
    allowed: readonly TValue[],
  ): Result<TValue> {
    if (!(allowed as readonly string[]).includes(value)) {
      return fail(
        domainErrorFactory.validation(`${field}.invalid`, `${field} is not supported.`, {
          allowed: [...allowed],
        }),
      );
    }

    return ok(value as TValue);
  }
}

/** Shared allowed-string policy used by domain factories. */
export const allowedStringPolicy = new AllowedStringPolicy();

/** Compatibility facade for allowed string validation. */
export const ensureAllowedString = <TValue extends string>(
  field: string,
  value: string,
  allowed: readonly TValue[],
): Result<TValue> => allowedStringPolicy.ensure(field, value, allowed);
