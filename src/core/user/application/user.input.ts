import type { EntityInput } from "../../shared/input/entity.input.ts";
import type { Email } from "../domain/email.ts";
import type { Telephone } from "../domain/telephone.ts";

type BaseUser = {
  name: string;
  email: Email;
  telephone: Telephone;
}

export type User<Status, Extra = unknown> = EntityInput<Status> & BaseUser & Extra;
