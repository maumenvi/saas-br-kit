import type { EntityInput } from '../../../shared/input/entity.input.ts';
import { CNPJ } from "../domain/cnpj.ts";

type BaseOrganization = {
  name: string;
  cnpj: CNPJ;
}

export type Organization<Status, Extra = unknown> = EntityInput<Status> & BaseOrganization & Extra;
