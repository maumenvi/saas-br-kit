import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Actor, UserActor } from './actor.ts';

export interface ActorRepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<Actor<Status, Extra>> {
  findByEmail(email: string): Promise<UserActor<Status, Extra> | null>;
  findByTelephone(telephone: string): Promise<UserActor<Status, Extra> | null>;
  findByName(name: string): Promise<Actor<Status, Extra>[]>;
  confirmEmail(actorId: string, email: string, verifiedAt: Date): Promise<boolean>;
  confirmTelephone(
    actorId: string,
    telephone: string,
    verifiedAt: Date,
  ): Promise<boolean>;
}
