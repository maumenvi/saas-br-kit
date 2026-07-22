import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type {
  RegisterVerificationAttemptResult,
  VerificationRepositoryPort,
  VerificationTarget,
} from '../core/entities/verification/verification.repositories.ts';
import type { Verification } from '../core/entities/verification/verification.ts';
import type { Status } from './status.ts';

type StoredVerification = Verification<Status, RepositoriesExtra['memberships']>;

export class VerificationRepositoryMock
  implements VerificationRepositoryPort<Status, RepositoriesExtra['memberships']>
{
  readonly verifications: StoredVerification[] = [];

  save(verification: StoredVerification): Promise<void> {
    this.verifications.push(verification);
    return Promise.resolve();
  }

  findById(id: string): Promise<StoredVerification | null> {
    return Promise.resolve(
      this.verifications.find(verification => verification.id === id) ?? null,
    );
  }

  acceptIfPending(id: string, acceptedAt: Date): Promise<boolean> {
    const index = this.pendingIndex(id);
    if (index === -1) return Promise.resolve(false);
    this.verifications[index] = Object.freeze({
      ...this.verifications[index],
      status: 'ACCEPTED',
      acceptedAt,
    }) as StoredVerification;
    return Promise.resolve(true);
  }

  expireIfPending(id: string, expiredAt: Date): Promise<boolean> {
    const index = this.pendingIndex(id);
    if (index === -1) return Promise.resolve(false);
    this.expireAt(index, expiredAt);
    return Promise.resolve(true);
  }

  expirePending(expiresAt: Date): Promise<number> {
    let count = 0;
    this.verifications.forEach((verification, index) => {
      if (
        verification.status === 'PENDING' &&
        verification.expiresAt.getTime() <= expiresAt.getTime()
      ) {
        this.expireAt(index, expiresAt);
        count += 1;
      }
    });
    return Promise.resolve(count);
  }

  expirePendingFor(target: VerificationTarget, expiredAt: Date): Promise<number> {
    let count = 0;
    this.verifications.forEach((verification, index) => {
      if (
        verification.status === 'PENDING' &&
        verification.purpose === target.purpose &&
        verification.actorId === target.actorId &&
        verification.organizationId === target.organizationId
      ) {
        this.expireAt(index, expiredAt);
        count += 1;
      }
    });
    return Promise.resolve(count);
  }

  registerFailedAttempt(
    id: string,
    attemptedAt: Date,
  ): Promise<RegisterVerificationAttemptResult | null> {
    const index = this.pendingIndex(id);
    if (index === -1) return Promise.resolve(null);
    const current = this.verifications[index];
    const attempts = current.attempts + 1;
    const rejected = attempts >= current.maxAttempts;
    this.verifications[index] = Object.freeze({
      ...current,
      attempts,
      status: rejected ? 'REJECTED' : 'PENDING',
      rejectedAt: rejected ? attemptedAt : null,
    }) as StoredVerification;
    return Promise.resolve(Object.freeze({ attempts, rejected }));
  }

  private pendingIndex(id: string): number {
    return this.verifications.findIndex(
      verification => verification.id === id && verification.status === 'PENDING',
    );
  }

  private expireAt(index: number, expiredAt: Date): void {
    this.verifications[index] = Object.freeze({
      ...this.verifications[index],
      status: 'EXPIRED',
      expiredAt,
    }) as StoredVerification;
  }
}
