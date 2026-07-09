import type { IdGeneratorPort } from "../core/index.ts";

/**
 * Generates deterministic sequential ids for tests.
 */
export class SequentialIdGenerator implements IdGeneratorPort {
  #nextId = 1;

  private readonly prefix: string;

  /** Stores the id prefix used by generated values. */
  constructor(prefix = "id") {
    this.prefix = prefix;
    Object.freeze(this);
  }

  /**
   * Returns the next id in the deterministic sequence.
   */
  newId(): string {
    const id = `${this.prefix}_${this.#nextId}`;
    this.#nextId += 1;
    return id;
  }
}

export function createSequentialIdGenerator(prefix = "id"): IdGeneratorPort {
  return new SequentialIdGenerator(prefix);
}
