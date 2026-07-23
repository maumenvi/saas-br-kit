export type IdempotencyIdentity = Readonly<{
  actorId: string;
  organizationId: string;
}>;

export type IdempotencyExecution<Input> = Readonly<{
  action: string;
  fingerprint: string;
  input: Input;
  identity?: IdempotencyIdentity;
  key: string;
}>;

export type IdempotencyAcquireResult<Output> =
  | Readonly<{
    status: 'ACQUIRED';
    leaseId: string;
  }>
  | Readonly<{
    status: 'REPLAY';
    output: Output;
  }>
  | Readonly<{
    status: 'IN_PROGRESS';
  }>;

export type IdempotencyCompletion<Output> = Readonly<{
  fingerprint: string;
  key: string;
  leaseId: string;
  output: Output;
}>;

export type IdempotencyRelease = Readonly<{
  fingerprint: string;
  key: string;
  leaseId: string;
}>;

export interface IdempotencyPort {
  acquire<Input, Output>(
    execution: IdempotencyExecution<Input>,
  ): Promise<IdempotencyAcquireResult<Output>>;

  complete<Output>(completion: IdempotencyCompletion<Output>): Promise<void>;

  release(release: IdempotencyRelease): Promise<void>;
}
