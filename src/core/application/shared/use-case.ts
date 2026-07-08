import {
  type CoreError,
  CoreFunctionalityNotConfiguredError,
  coreResult,
  isCoreFunctionalityNotConfiguredError,
  type Result,
} from "../../errors/index.ts";

/**
 * Executes application flows and converts unexpected dependency failures to Result errors.
 */
export class UseCaseRunner {
  /**
   * Runs one use case operation and preserves the expected Result contract.
   */
  async runSafely<TValue>(
    operation: () => Promise<Result<TValue, CoreError>>,
  ): Promise<Result<TValue, CoreError>> {
    try {
      return await operation();
    } catch (error) {
      if (this.isFunctionalityNotConfigured(error)) {
        return coreResult.fail(
          coreResult.createError({
            kind: "infrastructure",
            code: "core.functionality_not_configured",
            message: "Core functionality is not configured.",
            details: {
              functionality:
                error instanceof CoreFunctionalityNotConfiguredError
                  ? error.functionality
                  : "dependency",
            },
          }),
        );
      }

      return coreResult.fail(
        coreResult.createError({
          kind: "infrastructure",
          code: "core.infrastructure_failure",
          message: "A core dependency failed while executing the use case.",
          retryable: true,
        }),
      );
    }
  }

  private isFunctionalityNotConfigured(error: unknown): boolean {
    if (isCoreFunctionalityNotConfiguredError(error)) return true;
    return (
      error instanceof TypeError &&
      (/Cannot read (properties|property) of (undefined|null)/.test(error.message) ||
        /is not a function/.test(error.message))
    );
  }
}

/** Shared use case runner used by application classes. */
export const useCaseRunner = new UseCaseRunner();

/** Compatibility facade for running legacy use case call sites safely. */
export const runUseCaseSafely = <TValue>(
  operation: () => Promise<Result<TValue, CoreError>>,
): Promise<Result<TValue, CoreError>> => useCaseRunner.runSafely(operation);
