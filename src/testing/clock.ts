import type { ClockPort } from "../core/index.ts";

/**
 * Returns the same timestamp snapshot for deterministic tests.
 */
export class FixedClock implements ClockPort {
  readonly #fixedTime: number;

  /** Stores the timestamp snapshot used by the test clock. */
  constructor(date: Date) {
    this.#fixedTime = date.getTime();
    Object.freeze(this);
  }

  /**
   * Returns a fresh Date instance for the configured timestamp.
   */
  now(): Date {
    return new Date(this.#fixedTime);
  }
}

export function createFixedClock(date: Date): ClockPort {
  return new FixedClock(date);
}
