import { MEMBERSHIP_PERMISSION_KEYS } from './membership.permissions.ts';
import { ORGANIZATION_PERMISSION_KEYS } from './organization.permissions.ts';
import { USER_PERMISSION_KEYS } from './user.permissions.ts';

export const PERMISSION_KEYS = [
  ...ORGANIZATION_PERMISSION_KEYS,
  ...MEMBERSHIP_PERMISSION_KEYS,
  ...USER_PERMISSION_KEYS,
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
