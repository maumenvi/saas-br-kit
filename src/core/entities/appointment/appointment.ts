import type { EntityInput } from '../../shared/input/entity.input.ts';

export const APPOINTMENT_PAYMENT_TYPES = [
  'subscription',
  'credit',
  'debit',
  'pix',
  'cash',
  'others',
] as const;

export type AppointmentPaymentType =
  (typeof APPOINTMENT_PAYMENT_TYPES)[number];

export type Appointment<Status, Extra = unknown> = EntityInput<Status> & {
  organizationId: string;
  datetimeInitial: Date;
  datetimeFinal: Date;
  customerId: string;
  serviceIds: string[];
  paymentType: AppointmentPaymentType;
  paymentProvider: string;
  isPlanService: boolean;
  subscriptionId?: string;
  confirmedAt?: Date;
} & Extra;
