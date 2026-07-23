export type CalendarAppointmentInput = Readonly<{
  appointmentId: string;
  organizationId: string;
  customerId: string;
  serviceIds: string[];
  datetimeInitial: Date;
  datetimeFinal: Date;
}>;

export interface CalendarIntegrationPort {
  upsertAppointment(input: CalendarAppointmentInput): Promise<void>;
  cancelAppointment(input: CalendarAppointmentInput): Promise<void>;
}
