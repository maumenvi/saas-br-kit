import type { EntityInput } from '../../shared/input/entity.input.ts';
import type { Email } from './domain/email.ts';
import type { Telephone } from './domain/telephone.ts';

export const ACTOR_TYPES = ['USER', 'CLIENT', 'SERVICE'] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];

type BaseActor<Status, Extra> = EntityInput<Status> & {
  name: string;
} & Extra;

export type UserActor<Status, Extra = unknown> = BaseActor<Status, Extra> & {
  type: 'USER';
  email: Email;
  telephone: Telephone;
  passwordHash: string;
  emailVerified: boolean;
  telephoneVerified: boolean;
};

export type ClientActor<Status, Extra = unknown> = BaseActor<Status, Extra> & {
  type: 'CLIENT';
};

export type ServiceActor<Status, Extra = unknown> = BaseActor<Status, Extra> & {
  type: 'SERVICE';
};

export type Actor<Status, Extra = unknown> =
  | UserActor<Status, Extra>
  | ClientActor<Status, Extra>
  | ServiceActor<Status, Extra>;
