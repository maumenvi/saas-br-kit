import { CoreCompositionError } from "./errors.ts";
import type { CoreContextFragment } from "./registration.ts";

const containerKeys = new Set([
  "adapters",
  "auth",
  "notifications",
  "repositories",
  "tenantAccess",
]);

/** Merges context fragments while rejecting accidental dependency replacement. */
export class CoreContextMerger {
  /** Produces a new context object without mutating registration fragments. */
  merge(fragments: readonly CoreContextFragment[]): Readonly<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const fragment of fragments) {
      for (const [key, value] of Object.entries(fragment)) {
        if (value === undefined) continue;
        if (containerKeys.has(key)) {
          result[key] = this.mergeContainer(key, this.asRecord(result[key]), this.asRecord(value));
          continue;
        }
        this.assignUnique(result, key, value, key);
      }
    }
    return Object.freeze(result);
  }

  private mergeContainer(
    container: string,
    current: Readonly<Record<string, unknown>>,
    incoming: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, unknown>> {
    const result: Record<string, unknown> = { ...current };
    for (const [key, value] of Object.entries(incoming)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        const previous = result[key];
        if (previous !== undefined && !Array.isArray(previous)) {
          throw this.conflict(`${container}.${key}`);
        }
        result[key] = Object.freeze([...(previous ?? []), ...value]);
        continue;
      }
      this.assignUnique(result, key, value, `${container}.${key}`);
    }
    return Object.freeze(result);
  }

  private assignUnique(
    target: Record<string, unknown>,
    key: string,
    value: unknown,
    path: string,
  ): void {
    if (key in target) throw this.conflict(path);
    target[key] = value;
  }

  private asRecord(value: unknown): Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Readonly<Record<string, unknown>>)
      : {};
  }

  private conflict(path: string): CoreCompositionError {
    return new CoreCompositionError(
      "core.context_conflict",
      `Context property "${path}" was provided more than once.`,
    );
  }
}
