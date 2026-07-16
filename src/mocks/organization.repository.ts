import type { Organization } from '../core/entities/organization/application/organization.input.ts';
import type { OrganizationRepositoryPort } from '../core/entities/organization/organization.repositories.ts';
import type { RepositoriesExtra } from '../core/context/app.context.ts';
import { type Status } from "./status.ts";

export class OrganizationRepositoryMock implements OrganizationRepositoryPort<Status, RepositoriesExtra['organizations']> {
  readonly organizations: Organization<Status>[] = []

  save(organization: Organization<Status>): Promise<void> {
    this.organizations.push(organization);
    return Promise.resolve();
  }

  update(organization: Organization<Status>): Promise<void> {
    const index = this.organizations.findIndex(u => u.id === organization.id);
    if (index !== -1) {
      this.organizations[index] = organization;
    }
    return Promise.resolve();
  }
  changeStatus(organization: Organization<Status>): Promise<void> {
    const index = this.organizations.findIndex(u => u.id === organization.id);
    if (index !== -1) {
      this.organizations[index].status = "inactive" as Status;
    }
    return Promise.resolve();
  }

  findById(id: string): Promise<Organization<Status> | null> {
    const organization = this.organizations.find(u => u.id === id) || null;
    return Promise.resolve(organization);
  }
  findByCnpj(cnpj: string): Promise<Organization<Status> | null> {
    const organization = this.organizations.find(u => u.cnpj.value === cnpj) || null;
    return Promise.resolve(organization);
  }
}
