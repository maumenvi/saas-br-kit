export const ORGANIZATION_PERMISSION_KEYS = [
  'organization:create',
  'organization:update',
  'organization:change-status',
  'organization:find',
] as const;

export type OrganizationPermissionKey =
  (typeof ORGANIZATION_PERMISSION_KEYS)[number];
