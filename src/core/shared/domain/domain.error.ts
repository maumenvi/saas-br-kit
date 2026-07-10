export type DomainInput<Code extends string = string, Target extends string = string> = {
  code: Code;
  target: Target;
  message: string;
  details?: Record<string, unknown>;
}

export class DomainError<
  Code extends string = string,
  Target extends string = string
> extends Error {
  readonly code: Code;
  readonly target: Target;
  readonly details: Record<string, unknown>;

  constructor(DomainInput: DomainInput<Code, Target>) {
    super(DomainInput.message);
    this.code = DomainInput.code;
    this.target = DomainInput.target;
    this.details = DomainInput.details ?? {};
  }
}