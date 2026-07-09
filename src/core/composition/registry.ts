import { CoreCompositionError } from "./errors.ts";
import type { CorePort } from "./port.ts";

type StoredPort = Readonly<{
  port: CorePort<unknown>;
  values: readonly unknown[];
}>;

/** Stores typed port values while one immutable Core application is being built. */
export class CorePortRegistry {
  readonly #ports = new Map<string, StoredPort>();

  /** Provides one value and rejects duplicate values for single-cardinality ports. */
  provide<TValue>(port: CorePort<TValue>, value: TValue): void {
    const current = this.#ports.get(port.id);
    if (current !== undefined && !port.multiple) {
      throw new CoreCompositionError(
        "core.port_duplicate",
        `Port "${port.id}" was provided more than once.`,
      );
    }
    this.#ports.set(port.id, {
      port: port as CorePort<unknown>,
      values: Object.freeze([...(current?.values ?? []), value]),
    });
  }

  /** Resolves one required single-cardinality port. */
  resolve<TValue>(port: CorePort<TValue>): TValue {
    const value = this.#ports.get(port.id)?.values[0];
    if (value === undefined) {
      throw new CoreCompositionError(
        "core.port_missing",
        `Port "${port.id}" is not available: ${port.description}`,
      );
    }
    return value as TValue;
  }

  /** Resolves every value contributed to a multiple-cardinality port. */
  resolveAll<TValue>(port: CorePort<TValue>): readonly TValue[] {
    return Object.freeze([...(this.#ports.get(port.id)?.values ?? [])]) as readonly TValue[];
  }

  /** Indicates whether at least one value exists for a port. */
  has(port: CorePort<unknown>): boolean {
    return (this.#ports.get(port.id)?.values.length ?? 0) > 0;
  }

  /** Returns the current number of values for installation validation. */
  count(port: CorePort<unknown>): number {
    return this.#ports.get(port.id)?.values.length ?? 0;
  }
}
