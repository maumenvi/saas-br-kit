import type {
  IdempotencyAcquireResult,
  IdempotencyExecution,
  IdempotencyIdentity,
  IdempotencyPort,
} from '../../ports/idempotency.port.ts';
import { DomainError } from '../domain/domain.error.ts';
import type { Handler, Interceptor } from './handler.ts';

const IDEMPOTENCY_TARGET =
  'src/core/shared/application/idempotency.intercept.ts';

export const IDEMPOTENCY_ERROR_CODE = {
  IN_PROGRESS: 'IDEMPOTENCY_IN_PROGRESS',
} as const;

export const IdempotencyErrors = {
  inProgress: (key: string) =>
    new DomainError({
      code: IDEMPOTENCY_ERROR_CODE.IN_PROGRESS,
      target: IDEMPOTENCY_TARGET,
      message: 'An execution with the same idempotency key is in progress.',
      details: { key },
    }),
};

export class IdempotencyIntercept<Input, Output> implements Interceptor<Input, Output> {
  private readonly action: string;
  private readonly identity?: IdempotencyIdentity;
  private readonly idempotencyProvider: IdempotencyPort;

  constructor(
    action: string,
    idempotencyProvider: IdempotencyPort,
    identity?: IdempotencyIdentity,
  ) {
    this.action = action;
    this.idempotencyProvider = idempotencyProvider;
    this.identity = identity
      ? Object.freeze({
        actorId: identity.actorId,
        organizationId: identity.organizationId,
      })
      : undefined;
  }

  async intercept(input: Input, next: Handler<Input, Output>): Promise<Output> {
    const fingerprint = await hash(canonicalize(input));
    const key = await hash(canonicalize({
      action: this.action,
      fingerprint,
      identity: this.identity ?? null,
    }));
    const execution: IdempotencyExecution<Input> = Object.freeze({
      action: this.action,
      fingerprint,
      input,
      ...(this.identity ? { identity: this.identity } : {}),
      key,
    });

    const acquisition = await this.idempotencyProvider.acquire<Input, Output>(
      execution,
    );

    return this.resolveAcquisition(acquisition, execution, input, next);
  }

  private async resolveAcquisition(
    acquisition: IdempotencyAcquireResult<Output>,
    execution: IdempotencyExecution<Input>,
    input: Input,
    next: Handler<Input, Output>,
  ): Promise<Output> {
    switch (acquisition.status) {
      case 'REPLAY':
        return acquisition.output;
      case 'IN_PROGRESS':
        throw IdempotencyErrors.inProgress(execution.key);
      case 'ACQUIRED':
        return this.executeAcquired(acquisition.leaseId, execution, input, next);
    }
  }

  private async executeAcquired(
    leaseId: string,
    execution: IdempotencyExecution<Input>,
    input: Input,
    next: Handler<Input, Output>,
  ): Promise<Output> {
    let output: Output;

    try {
      output = await next(input);
    } catch (error: unknown) {
      await this.idempotencyProvider.release(Object.freeze({
        fingerprint: execution.fingerprint,
        key: execution.key,
        leaseId,
      }));
      throw error;
    }

    await this.idempotencyProvider.complete(Object.freeze({
      fingerprint: execution.fingerprint,
      key: execution.key,
      leaseId,
      output,
    }));

    return output;
  }
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );

  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}

function canonicalize(value: unknown, ancestors = new WeakSet<object>()): string {
  return JSON.stringify(toCanonicalValue(value, ancestors));
}

function toCanonicalValue(
  value: unknown,
  ancestors: WeakSet<object>,
): unknown {
  if (value === null) return ['null'];

  switch (typeof value) {
    case 'string':
      return ['string', value];
    case 'boolean':
      return ['boolean', value];
    case 'number':
      return ['number', Object.is(value, -0) ? '-0' : String(value)];
    case 'bigint':
      return ['bigint', value.toString()];
    case 'undefined':
      return ['undefined'];
    case 'function':
    case 'symbol':
      throw new TypeError(`Unsupported idempotency input type: ${typeof value}.`);
    case 'object':
      break;
  }

  if (ancestors.has(value)) {
    throw new TypeError('Circular idempotency input is not supported.');
  }

  ancestors.add(value);
  try {
    if (value instanceof Date) {
      return ['date', value.toISOString()];
    }

    if (Array.isArray(value)) {
      return [
        'array',
        value.map((item) => toCanonicalValue(item, ancestors)),
      ];
    }

    return [
      'object',
      Object.keys(value)
        .sort()
        .map((key) => [
          key,
          toCanonicalValue((value as Record<string, unknown>)[key], ancestors),
        ]),
    ];
  } finally {
    ancestors.delete(value);
  }
}
