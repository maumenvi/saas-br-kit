export const ACTOR_PERMISSION_KEYS = [
  'actor:create',
  'actor:update',
  'actor:change-status',
  'actor:find',
] as const;

export type ActorPermissionKey = (typeof ACTOR_PERMISSION_KEYS)[number];
