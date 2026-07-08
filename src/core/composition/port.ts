/** Describes one typed dependency that registrations can provide or require. */
export class CorePort<TValue> {
  /** Stable identifier used in diagnostics and dependency resolution. */
  public readonly id: string;

  /** Human-readable explanation shown when composition fails. */
  public readonly description: string;

  /** Whether several registrations may contribute values to this port. */
  public readonly multiple: boolean;

  /** Creates an immutable typed port token. */
  constructor(input: Readonly<{ id: string; description: string; multiple?: boolean }>) {
    this.id = input.id;
    this.description = input.description;
    this.multiple = input.multiple ?? false;
    Object.freeze(this);
  }

  /** Retains the value type without exposing runtime state. */
  declare readonly valueType: TValue;
}
