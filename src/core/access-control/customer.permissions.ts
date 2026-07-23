export const CUSTOMER_PERMISSION_KEYS = [
  'customer:create',
  'customer:update',
  'customer:change-status',
  'customer:find',
] as const;

export type CustomerPermissionKey = (typeof CUSTOMER_PERMISSION_KEYS)[number];
