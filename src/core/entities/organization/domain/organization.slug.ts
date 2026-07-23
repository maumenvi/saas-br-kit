import { OrganizationErrors } from './organization.errors.ts';

export class OrganizationSlug {
  public readonly value: string;

  private readonly slugPattern =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

  constructor(value: string) {
    this.value = value.trim().toLowerCase();
    Object.freeze(this);
  }

  validate(): void {
    if (!this.slugPattern.test(this.value)) {
      throw OrganizationErrors.invalidSlug(this.value);
    }
  }
}
