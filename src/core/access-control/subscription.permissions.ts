export const SUBSCRIPTION_PERMISSION_KEYS = [
  'subscription:create',
  'subscription:update',
  'subscription:change-status',
  'subscription:find',
] as const;

export type SubscriptionPermissionKey =
  (typeof SUBSCRIPTION_PERMISSION_KEYS)[number];
