import type { Appointment } from '../appointment.ts';

export type CreateAppointmentInput<Status, Extra = unknown> = Omit<
  Appointment<Status, Extra>,
  'datetimeFinal' | 'confirmedAt' | 'paymentProvider'
> & {
  datetimeFinal?: Date;
  paymentProvider?: string;
};

export type UpdateAppointmentInput<Status, Extra = unknown> = Omit<
  Appointment<Status, Extra>,
  'datetimeFinal'
> & {
  datetimeFinal?: Date;
};
