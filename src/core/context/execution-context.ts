export type ExecutionActor =
  | Readonly<{ type: "system"; id?: string }>
  | Readonly<{ type: "user"; id: string }>
  | Readonly<{ type: "service"; id: string }>;

export type ExecutionMetadata = Readonly<Record<string, unknown>>;

export type CreateExecutionContextInput = Readonly<{
  requestId: string;
  actor: ExecutionActor;
  organizationId?: string;
  permissions?: readonly string[];
  metadata?: ExecutionMetadata;
}>;

/**
 * Carries request, actor, tenant and metadata for one operation.
 */
export class ExecutionContext {
  /** Stable request or job identifier for correlation. */
  public readonly requestId: string;

  /** Actor that initiated the current operation. */
  public readonly actor: ExecutionActor;

  /** Optional tenant scope for tenant-bound use cases. */
  declare readonly organizationId?: string;

  /** Permissions resolved by the runtime or authorization layer. */
  public readonly permissions: readonly string[];

  /** Safe metadata attached to the operation. */
  declare readonly metadata?: ExecutionMetadata;

  /** Builds an already-normalized immutable execution context. */
  private constructor(
    input: Required<Omit<CreateExecutionContextInput, "organizationId" | "metadata">> &
      Pick<CreateExecutionContextInput, "organizationId" | "metadata">,
  ) {
    this.requestId = input.requestId;
    this.actor = Object.freeze({ ...input.actor });
    if (input.organizationId !== undefined) {
      this.organizationId = input.organizationId;
    }
    this.permissions = Object.freeze([...(input.permissions ?? [])]);
    if (input.metadata !== undefined) {
      this.metadata = Object.freeze({ ...input.metadata });
    }
    Object.freeze(this);
  }

  /**
   * Creates an immutable operation context without sharing mutable input references.
   */
  static create(input: CreateExecutionContextInput): ExecutionContext {
    return new ExecutionContext({
      requestId: input.requestId,
      actor: input.actor,
      permissions: input.permissions ?? [],
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
    });
  }
}
