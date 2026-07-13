import type { RepositoryPort } from "../shared/application/ports/repositories.port.ts";
import { type Organization } from "./application/organization.input.ts";

export interface OrganizationRepositoryPort<Status> extends RepositoryPort<Organization<Status>> {
  save(organization: Organization<Status>): Promise<void>;
  update(organization: Organization<Status>): Promise<void>;
  changeStatus(organization: Organization<Status>): Promise<void>;
  findById(id: string): Promise<Organization<Status> | null>;
  findByCnpj(cnpj: string): Promise<Organization<Status> | null>;
}
