export interface OrganizationValidationQueryPort {
  findById(id: string): Promise<{
    id: string;
    enabled: boolean;
  } | null>;
}
