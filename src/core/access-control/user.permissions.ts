export const USER_PERMISSION_KEYS = [
  'user:create',
  'user:update',
  'user:change-status',
  'user:find',
] as const;

export type UserPermissionKey = (typeof USER_PERMISSION_KEYS)[number];
