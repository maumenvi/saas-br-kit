export const MEMBERSHIP_PERMISSION_KEYS = [
  'membership:create',
  'membership:update',
  'membership:change-status',
  'membership:find',
] as const;

export type MembershipPermissionKey =
  (typeof MEMBERSHIP_PERMISSION_KEYS)[number];
