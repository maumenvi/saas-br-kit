import { type CoreError, coreResult } from "../../errors/result.ts";

/**
 * Creates normalized domain errors without depending on external validators.
 */
export class DomainErrorFactory {
  /**
   * Builds a validation error for invalid entity input or value objects.
   */
  validation(
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ): CoreError {
    return coreResult.createError({
      kind: "validation",
      code,
      message,
      ...(details === undefined ? {} : { details }),
    });
  }

  /**
   * Builds a domain-rule error for invalid business transitions.
   */
  rule(code: string, message: string, details?: Readonly<Record<string, unknown>>): CoreError {
    return coreResult.createError({
      kind: "domain",
      code,
      message,
      ...(details === undefined ? {} : { details }),
    });
  }
}

/** Shared domain error factory used by validators and entities. */
export const domainErrorFactory = new DomainErrorFactory();

/** Compatibility facade for validation errors. */
export const createDomainValidationError = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): CoreError => domainErrorFactory.validation(code, message, details);

/** Compatibility facade for domain-rule errors. */
export const createDomainRuleError = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): CoreError => domainErrorFactory.rule(code, message, details);
