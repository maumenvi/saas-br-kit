import type { ActorType } from '../actor/actor.ts';

export type AuthenticatedActor = {
  actorId: string;
  actorType: ActorType;
};

export interface AuthPort<Input> {
  authenticate(auth: Input): Promise<AuthenticatedActor | null>;
}
