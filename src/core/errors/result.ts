export const CORE_ERROR_KINDS = [
  "validation",
  "domain",
  "authorization",
  "not_found",
  "conflict",
  "external",
  "infrastructure",
] as const;

export type CoreErrorKind = (typeof CORE_ERROR_KINDS)[number];

export type CoreErrorDetails = Readonly<Record<string, unknown>>;

export type CoreError = Readonly<{
  kind: CoreErrorKind;
  code: string;
  message: string;
  details?: CoreErrorDetails;
  retryable?: boolean;
}>;

export type SuccessResult<T> = Readonly<{
  ok: true;
  data: T;
}>;

export type FailureResult<E extends CoreError = CoreError> = Readonly<{
  ok: false;
  error: E;
}>;

export type Result<T, E extends CoreError = CoreError> = SuccessResult<T> | FailureResult<E>;

/**
 * Builds immutable Result objects and normalized Core errors.
 */
export class CoreResultFactory {
  /**
   * Wraps successful data in the SDK's discriminated Result shape.
   */
  ok<T>(data: T): SuccessResult<T> {
    return Object.freeze({ ok: true, data });
  }

  /**
   * Wraps an expected Core error in the SDK's discriminated Result shape.
   */
  fail<E extends CoreError>(error: E): FailureResult<E> {
    return Object.freeze({ ok: false, error });
  }

  /**
   * Freezes a Core error and clones details to avoid shared mutable references.
   */
  createError(input: CoreError): CoreError {
    return Object.freeze({
      kind: input.kind,
      code: input.code,
      message: input.message,
      ...(input.details === undefined ? {} : { details: Object.freeze({ ...input.details }) }),
      ...(input.retryable === undefined ? {} : { retryable: input.retryable }),
    });
  }
}

/** Shared Result factory used by Core classes and compatibility exports. */
export const coreResult = new CoreResultFactory();

/** Compatibility facade for creating successful Results. */
export const ok = <T>(data: T): SuccessResult<T> => coreResult.ok(data);

/** Compatibility facade for creating failed Results. */
export const fail = <E extends CoreError>(error: E): FailureResult<E> => coreResult.fail(error);

/** Compatibility facade for normalizing Core errors. */
export const createCoreError = (input: CoreError): CoreError => coreResult.createError(input);
