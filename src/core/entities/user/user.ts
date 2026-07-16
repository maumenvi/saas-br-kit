import type { EntityInput } from '../../shared/input/entity.input.ts';
import type { Email } from "./domain/email.ts";
import type { Telephone } from "./domain/telephone.ts";

type BaseUser = {
  name: string;
  email: Email;
  telephone: Telephone;
  passwordHash: string;
  emailVerified: boolean;
}

export type User<Status, Extra = unknown> = EntityInput<Status> & BaseUser & Extra;
