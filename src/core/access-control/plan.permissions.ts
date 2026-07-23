export const PLAN_PERMISSION_KEYS = [
  'plan:create',
  'plan:update',
  'plan:change-status',
  'plan:find',
] as const;

export type PlanPermissionKey = (typeof PLAN_PERMISSION_KEYS)[number];
