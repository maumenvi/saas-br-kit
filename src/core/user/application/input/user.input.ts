import { Email } from "../../domain/email.ts";
import { Telephone } from "../../domain/telephone.ts";

type BaseUser = {
  id: string;
  name: string;
  email: Email;
  telephone: Telephone;
}

export type User<Extra extends Object = {}> = BaseUser & Extra;
