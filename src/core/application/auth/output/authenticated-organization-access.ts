export type AuthenticatedOrganizationAccess = Readonly<{
  organizationId: string;
  name: string;
  role: string;
  permissions: readonly string[];
  subdomain?: string;
  url?: string;
}>;
