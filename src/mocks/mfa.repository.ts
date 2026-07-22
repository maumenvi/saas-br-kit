import type { MfaRepositoryPort } from '../core/entities/mfa/mfa.repositories.ts';
import type { Mfa } from '../core/entities/mfa/mfa.ts';

export class MfaRepositoryMock implements MfaRepositoryPort {
  readonly mfas: Mfa[] = [];

  save(mfa: Mfa): Promise<void> {
    this.mfas.push(mfa);
    return Promise.resolve();
  }

  findByActorId(actorId: string): Promise<Mfa | null> {
    const mfa = [...this.mfas]
      .reverse()
      .find((current) => current.actorId === actorId) ?? null;
    return Promise.resolve(mfa);
  }

  findActiveByActorId(actorId: string): Promise<Mfa | null> {
    const mfa = [...this.mfas]
      .reverse()
      .find(
        (current) =>
          current.actorId === actorId && current.status === 'ACTIVE',
      ) ?? null;
    return Promise.resolve(mfa);
  }

  activate(id: string, counter: number, updatedAt: Date): Promise<boolean> {
    const index = this.mfas.findIndex((current) => current.id === id);
    const current = this.mfas[index];
    if (
      !current ||
      current.status !== 'PENDING' ||
      (current.lastUsedCounter !== null && counter <= current.lastUsedCounter)
    ) {
      return Promise.resolve(false);
    }

    this.mfas[index] = Object.freeze({
      ...current,
      status: 'ACTIVE',
      lastUsedCounter: counter,
      updatedAt,
      activatedAt: updatedAt,
    });
    return Promise.resolve(true);
  }

  consumeCounter(
    id: string,
    counter: number,
    updatedAt: Date,
  ): Promise<boolean> {
    const index = this.mfas.findIndex((current) => current.id === id);
    const current = this.mfas[index];
    if (
      !current ||
      current.status !== 'ACTIVE' ||
      (current.lastUsedCounter !== null && counter <= current.lastUsedCounter)
    ) {
      return Promise.resolve(false);
    }

    this.mfas[index] = Object.freeze({
      ...current,
      lastUsedCounter: counter,
      updatedAt,
    });
    return Promise.resolve(true);
  }
}
