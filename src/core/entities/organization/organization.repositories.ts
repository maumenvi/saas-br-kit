import type { RepositoryPort } from '../../ports/repositories.port.ts';
import { type Organization } from "./organization.ts";

export interface OrganizationRepositoryPort<Status, Extra> extends RepositoryPort<Organization<Status, Extra>> {
  save(organization: Organization<Status, Extra>): Promise<void>;
  update(organization: Organization<Status, Extra>): Promise<void>;
  changeStatus(organization: Organization<Status, Extra>): Promise<void>;
  findById(id: string): Promise<Organization<Status, Extra> | null>;
  findByCnpj(cnpj: string): Promise<Organization<Status, Extra> | null>;
  findBySlug(slug: string): Promise<Organization<Status, Extra> | null>;
}
