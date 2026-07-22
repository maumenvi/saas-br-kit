import type { Mfa } from './mfa.ts';

export interface MfaRepositoryPort {
  save(mfa: Mfa): Promise<void>;
  findByActorId(actorId: string): Promise<Mfa | null>;
  findActiveByActorId(actorId: string): Promise<Mfa | null>;
  activate(id: string, counter: number, updatedAt: Date): Promise<boolean>;
  consumeCounter(id: string, counter: number, updatedAt: Date): Promise<boolean>;
}
