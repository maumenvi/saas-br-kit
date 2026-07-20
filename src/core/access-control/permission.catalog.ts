import { MEMBERSHIP_PERMISSION_KEYS } from './membership.permissions.ts';
import { ORGANIZATION_PERMISSION_KEYS } from './organization.permissions.ts';
import { ACTOR_PERMISSION_KEYS } from './actor.permissions.ts';

export const PERMISSION_KEYS = [
  ...ORGANIZATION_PERMISSION_KEYS,
  ...MEMBERSHIP_PERMISSION_KEYS,
  ...ACTOR_PERMISSION_KEYS,
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
