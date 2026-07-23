import type { EntityInput } from '../../shared/input/entity.input.ts';
import { CNPJ } from '../../shared/domain/cnpj.ts';
import type { OrganizationSlug } from './domain/organization.slug.ts';

type BaseOrganization = {
  name: string;
  readonly slug: OrganizationSlug;
  cnpj: CNPJ;
  ownerActorId: string;
}

export type Organization<Status, Extra = unknown> = EntityInput<Status> & BaseOrganization & Extra;
