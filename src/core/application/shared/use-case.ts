import { type CoreError, coreResult, type Result } from "../../errors/result.ts";

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
    } catch {
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
}

/** Shared use case runner used by application classes. */
export const useCaseRunner = new UseCaseRunner();

/** Compatibility facade for running legacy use case call sites safely. */
export const runUseCaseSafely = <TValue>(
  operation: () => Promise<Result<TValue, CoreError>>,
): Promise<Result<TValue, CoreError>> => useCaseRunner.runSafely(operation);
