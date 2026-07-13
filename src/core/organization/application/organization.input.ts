import type { EntityInput } from "../../shared/input/entity.input.ts";
import { CNPJ } from "../domain/cnpj.ts";

type BaseOrganization = {
  name: string;
  cnpj: CNPJ;
}

export type Organization<Status, Extra extends Object = {}> = EntityInput<Status> & BaseOrganization & Extra;
