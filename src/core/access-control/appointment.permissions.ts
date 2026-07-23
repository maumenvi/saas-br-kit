export const APPOINTMENT_PERMISSION_KEYS = [
  'appointment:create',
  'appointment:update',
  'appointment:change-status',
  'appointment:find',
  'appointment:cancel',
] as const;

export type AppointmentPermissionKey =
  (typeof APPOINTMENT_PERMISSION_KEYS)[number];
