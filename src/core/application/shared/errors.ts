import { coreResult, type Result } from "../../errors/result.ts";

/**
 * Creates expected application failures with normalized Core error metadata.
 */
export class ApplicationFailureFactory {
  /**
   * Builds an authorization failure for denied actor, tenant or permission checks.
   */
  authorization(
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ): Result<never> {
    return coreResult.fail(
      coreResult.createError({
        kind: "authorization",
        code,
        message,
        ...(details === undefined ? {} : { details }),
      }),
    );
  }

  /**
   * Builds a conflict failure when a requested state transition is not allowed.
   */
  conflict(
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ): Result<never> {
    return coreResult.fail(
      coreResult.createError({
        kind: "conflict",
        code,
        message,
        ...(details === undefined ? {} : { details }),
      }),
    );
  }

  /**
   * Builds a not-found failure for missing aggregate or repository records.
   */
  notFound(
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ): Result<never> {
    return coreResult.fail(
      coreResult.createError({
        kind: "not_found",
        code,
        message,
        ...(details === undefined ? {} : { details }),
      }),
    );
  }

  /**
   * Builds a retryable external failure for provider or integration problems.
   */
  external(
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ): Result<never> {
    return coreResult.fail(
      coreResult.createError({
        kind: "external",
        code,
        message,
        ...(details === undefined ? {} : { details }),
        retryable: true,
      }),
    );
  }
}

/** Shared application failure factory used by use case classes. */
export const applicationFailureFactory = new ApplicationFailureFactory();

/** Compatibility facade for creating authorization failures. */
export const createAuthorizationFailure = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Result<never> => applicationFailureFactory.authorization(code, message, details);

/** Compatibility facade for creating conflict failures. */
export const createConflictFailure = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Result<never> => applicationFailureFactory.conflict(code, message, details);

/** Compatibility facade for creating not-found failures. */
export const createNotFoundFailure = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Result<never> => applicationFailureFactory.notFound(code, message, details);

/** Compatibility facade for creating external failures. */
export const createExternalFailure = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Result<never> => applicationFailureFactory.external(code, message, details);
