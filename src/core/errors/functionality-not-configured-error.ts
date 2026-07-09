/** Error thrown by Core sentinels when a requested feature has no configured port. */
export class CoreFunctionalityNotConfiguredError extends Error {
  public readonly functionality: string;

  constructor(functionality: string) {
    super(`Core functionality "${functionality}" is not configured.`);
    this.name = "CoreFunctionalityNotConfiguredError";
    this.functionality = functionality;
  }
}

/** Checks unknown errors without depending on instanceof across package copies. */
export function isCoreFunctionalityNotConfiguredError(
  error: unknown,
): error is CoreFunctionalityNotConfiguredError {
  return (
    error instanceof CoreFunctionalityNotConfiguredError ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "CoreFunctionalityNotConfiguredError" &&
      "functionality" in error &&
      typeof error.functionality === "string")
  );
}
