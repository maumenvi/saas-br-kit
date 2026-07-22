import type { PermissionContext } from '../../access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../context/execution.context.ts';
import type { Handler, Interceptor } from '../../shared/application/handler.ts';
import type { Audit, AuditData, AuditError, AuditOutcome } from './audit.ts';
import type { AuditRepositoryPort } from './audit.repositories.ts';

const REDACTED = '[REDACTED]';
const CIRCULAR = '[CIRCULAR]';
const SENSITIVE_FIELD = /^(api[-_]?key|authorization|code|mfaCode|password|passwordHash|providerCredential|provisioningUri|refreshToken|secret|token|accessToken)$/i;

export type AuditIdentity = Readonly<{
  actorId: string | null;
  organizationId: string | null;
  membershipId: string | null;
}>;

export type AuditIdentityResolver<Input, Output> = (
  input: Input,
  output: Output | undefined,
) => Partial<AuditIdentity>;

export type AuditInterceptInput<Input, Output> = {
  action: string;
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  permissionContext?: PermissionContext;
  identityResolver?: AuditIdentityResolver<Input, Output>;
};

type AuditPersistenceInput = {
  outcome: AuditOutcome;
  input: AuditData;
  output: AuditData;
  error: AuditError | null;
  startedAt: Date;
  identity: AuditIdentity;
};

export class AuditIntercept<Input, Output> implements Interceptor<Input, Output> {
  private readonly action: string;
  private readonly executionContext: ExecutionContext;
  private readonly auditRepository: AuditRepositoryPort;
  private readonly identity: AuditIdentity;
  private readonly identityResolver?: AuditIdentityResolver<Input, Output>;

  constructor(input: AuditInterceptInput<Input, Output>) {
    this.action = input.action;
    this.executionContext = input.executionContext;
    this.auditRepository = input.auditRepository;
    this.identity = Object.freeze({
      actorId: input.permissionContext?.actorId ?? null,
      organizationId: input.permissionContext?.organizationId ?? null,
      membershipId: input.permissionContext?.id ?? null,
    });
    this.identityResolver = input.identityResolver;
  }

  async intercept(input: Input, next: Handler<Input, Output>): Promise<Output> {
    const startedAt = this.now();
    const inputSnapshot = toAuditData(input);

    try {
      const output = await next(input);
      this.dispatch({
        outcome: 'SUCCESS',
        input: inputSnapshot,
        output: toAuditData(output),
        error: null,
        startedAt,
        identity: this.resolveIdentity(input, output),
      });
      return output;
    } catch (error: unknown) {
      this.dispatch({
        outcome: 'ERROR',
        input: inputSnapshot,
        output: null,
        error: toAuditError(error),
        startedAt,
        identity: this.resolveIdentity(input, undefined),
      });
      throw error;
    }
  }

  private resolveIdentity(input: Input, output: Output | undefined): AuditIdentity {
    const resolved = this.identityResolver?.(input, output) ?? {};
    return {
      actorId: resolved.actorId ?? this.identity.actorId,
      organizationId: resolved.organizationId ?? this.identity.organizationId,
      membershipId: resolved.membershipId ?? this.identity.membershipId,
    };
  }

  private async persist(input: AuditPersistenceInput): Promise<void> {
    const completedAt = this.now();
    const audit: Audit = Object.freeze({
      id: this.generateId(),
      action: this.action,
      outcome: input.outcome,
      actorId: input.identity.actorId,
      organizationId: input.identity.organizationId,
      membershipId: input.identity.membershipId,
      input: input.input,
      output: input.output,
      error: input.error,
      startedAt: input.startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt.getTime() - input.startedAt.getTime()),
    });

    await this.auditRepository.save(audit);
  }

  private dispatch(input: AuditPersistenceInput): void {
    void this.persist(input).catch((error: unknown) => {
      this.executionContext.loggerProvider.error('Failed to persist audit.', error);
    });
  }

  private now(): Date {
    return this.executionContext.clock?.() ?? new Date();
  }

  private generateId(): string {
    return this.executionContext.idGenerator?.() ?? crypto.randomUUID();
  }
}

function toAuditError(error: unknown): AuditError {
  if (!(error instanceof Error)) {
    return Object.freeze({
      name: 'UnknownError',
      message: 'Unknown error',
      stack: null,
      code: null,
      target: null,
      details: toAuditData(error),
    });
  }

  const structured = error as Error & {
    code?: unknown;
    target?: unknown;
    details?: unknown;
  };

  return Object.freeze({
    name: error.name,
    message: error.message,
    stack: error.stack ?? null,
    code: typeof structured.code === 'string' ? structured.code : null,
    target: typeof structured.target === 'string' ? structured.target : null,
    details: toAuditData(structured.details),
  });
}

function toAuditData(value: unknown, ancestors = new WeakSet<object>()): AuditData {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (ancestors.has(value)) return CIRCULAR;

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => toAuditData(item, ancestors));
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_FIELD.test(key) ? REDACTED : toAuditData(item, ancestors),
      ]),
    );
  } finally {
    ancestors.delete(value);
  }
}
