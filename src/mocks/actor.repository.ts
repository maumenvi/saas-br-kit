import type { Actor, UserActor } from '../core/entities/actor/actor.ts';
import type { ActorRepositoryPort } from '../core/entities/actor/actor.repositories.ts';
import { type Status } from "./status.ts";

export class ActorRepositoryMock implements ActorRepositoryPort<Status> {
  readonly actors: Actor<Status>[] = [];

  save(actor: Actor<Status>): Promise<void> {
    this.actors.push(actor);
    return Promise.resolve();
  }

  update(actor: Actor<Status>): Promise<void> {
    const index = this.actors.findIndex(current => current.id === actor.id);
    if (index !== -1) {
      this.actors[index] = actor;
    }
    return Promise.resolve();
  }
  changeStatus(actor: Actor<Status>): Promise<void> {
    const index = this.actors.findIndex(current => current.id === actor.id);
    if (index !== -1) {
      this.actors[index].status = "inactive" as Status;
    }
    return Promise.resolve();
  }

  findById(id: string): Promise<Actor<Status> | null> {
    const actor = this.actors.find(current => current.id === id) || null;
    return Promise.resolve(actor);
  }
  findByEmail(email: string): Promise<UserActor<Status> | null> {
    const actor = this.actors.find(
      (current): current is UserActor<Status> =>
        current.type === 'USER' && current.email.value === email,
    ) ?? null;
    return Promise.resolve(actor);
  }
  findByTelephone(telephone: string): Promise<UserActor<Status> | null> {
    const actor = this.actors.find(
      (current): current is UserActor<Status> =>
        current.type === 'USER' && current.telephone.value === telephone,
    ) ?? null;
    return Promise.resolve(actor);
  }
  findByName(name: string): Promise<Actor<Status>[]> {
    const actors = this.actors.filter(current => current.name === name);
    return Promise.resolve(actors);
  }

  confirmEmail(actorId: string, email: string, _verifiedAt: Date): Promise<boolean> {
    const index = this.actors.findIndex(current =>
      current.id === actorId &&
      current.type === 'USER' &&
      current.email.value === email,
    );
    if (index === -1) return Promise.resolve(false);
    const actor = this.actors[index] as UserActor<Status>;
    this.actors[index] = Object.freeze({ ...actor, emailVerified: true });
    return Promise.resolve(true);
  }

  confirmTelephone(
    actorId: string,
    telephone: string,
    _verifiedAt: Date,
  ): Promise<boolean> {
    const index = this.actors.findIndex(current =>
      current.id === actorId &&
      current.type === 'USER' &&
      current.telephone.value === telephone,
    );
    if (index === -1) return Promise.resolve(false);
    const actor = this.actors[index] as UserActor<Status>;
    this.actors[index] = Object.freeze({ ...actor, telephoneVerified: true });
    return Promise.resolve(true);
  }
}
