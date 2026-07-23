import type {
  IdempotencyAcquireResult,
  IdempotencyCompletion,
  IdempotencyExecution,
  IdempotencyPort,
  IdempotencyRelease,
} from '../core/ports/idempotency.port.ts';

type ProcessingRecord = {
  status: 'PROCESSING';
  fingerprint: string;
  leaseId: string;
};

type CompletedRecord = {
  status: 'COMPLETED';
  fingerprint: string;
  leaseId: string;
  output: unknown;
};

type IdempotencyRecord = ProcessingRecord | CompletedRecord;

export class IdempotencyMock implements IdempotencyPort {
  readonly actions: string[] = [];
  readonly executions: IdempotencyExecution<unknown>[] = [];
  readonly completions: IdempotencyCompletion<unknown>[] = [];
  readonly releases: IdempotencyRelease[] = [];
  readonly #records = new Map<string, IdempotencyRecord>();

  async acquire<Input, Output>(
    execution: IdempotencyExecution<Input>,
  ): Promise<IdempotencyAcquireResult<Output>> {
    this.actions.push(execution.action);
    this.executions.push(execution);
    const record = this.#records.get(execution.key);

    if (record?.status === 'COMPLETED') {
      return Object.freeze({
        status: 'REPLAY',
        output: record.output as Output,
      });
    }

    if (record?.status === 'PROCESSING') {
      return Object.freeze({ status: 'IN_PROGRESS' });
    }

    const leaseId = crypto.randomUUID();
    this.#records.set(execution.key, {
      status: 'PROCESSING',
      fingerprint: execution.fingerprint,
      leaseId,
    });

    return Object.freeze({ status: 'ACQUIRED', leaseId });
  }

  async complete<Output>(
    completion: IdempotencyCompletion<Output>,
  ): Promise<void> {
    this.completions.push(completion);
    const record = this.#records.get(completion.key);

    if (
      record?.status !== 'PROCESSING' ||
      record.fingerprint !== completion.fingerprint ||
      record.leaseId !== completion.leaseId
    ) {
      return;
    }

    this.#records.set(completion.key, {
      status: 'COMPLETED',
      fingerprint: completion.fingerprint,
      leaseId: completion.leaseId,
      output: completion.output,
    });
  }

  async release(release: IdempotencyRelease): Promise<void> {
    this.releases.push(release);
    const record = this.#records.get(release.key);

    if (
      record?.status === 'PROCESSING' &&
      record.fingerprint === release.fingerprint &&
      record.leaseId === release.leaseId
    ) {
      this.#records.delete(release.key);
    }
  }
}
