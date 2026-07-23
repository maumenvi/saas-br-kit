export const SERVICE_PERMISSION_KEYS = [
  'service:create',
  'service:update',
  'service:change-status',
  'service:find',
] as const;

export type ServicePermissionKey = (typeof SERVICE_PERMISSION_KEYS)[number];
