export interface OrganizationStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean;
}
