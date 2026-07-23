import { MEMBERSHIP_PERMISSION_KEYS } from './membership.permissions.ts';
import { ORGANIZATION_PERMISSION_KEYS } from './organization.permissions.ts';
import { ACTOR_PERMISSION_KEYS } from './actor.permissions.ts';
import { SERVICE_PERMISSION_KEYS } from './service.permissions.ts';
import { CUSTOMER_PERMISSION_KEYS } from './customer.permissions.ts';
import { PLAN_PERMISSION_KEYS } from './plan.permissions.ts';
import { SUBSCRIPTION_PERMISSION_KEYS } from './subscription.permissions.ts';
import { APPOINTMENT_PERMISSION_KEYS } from './appointment.permissions.ts';

export const PERMISSION_KEYS = [
  ...ORGANIZATION_PERMISSION_KEYS,
  ...MEMBERSHIP_PERMISSION_KEYS,
  ...ACTOR_PERMISSION_KEYS,
  ...SERVICE_PERMISSION_KEYS,
  ...CUSTOMER_PERMISSION_KEYS,
  ...PLAN_PERMISSION_KEYS,
  ...SUBSCRIPTION_PERMISSION_KEYS,
  ...APPOINTMENT_PERMISSION_KEYS,
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
