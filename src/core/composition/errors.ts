/** Reports an invalid registration or port operation during composition. */
export class CoreCompositionError extends Error {
  /** Stable machine-readable failure code. */
  public readonly code: string;

  /** Creates a composition error without leaking adapter internals. */
  constructor(code: string, message: string) {
    super(message);
    this.name = "CoreCompositionError";
    this.code = code;
  }
}

/** Reports all unresolved dependencies when the application cannot be built. */
export class CoreBuildError extends Error {
  /** Stable machine-readable build failure code. */
  public readonly code = "core.build_failed";

  /** Missing or cyclic dependency descriptions. */
  public readonly issues: readonly string[];

  /** Creates one immutable aggregate build error. */
  constructor(issues: readonly string[]) {
    super(`Core build failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "CoreBuildError";
    this.issues = Object.freeze([...issues]);
  }
}
