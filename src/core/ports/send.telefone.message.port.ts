export const TELEPHONE_MESSAGE_TYPES = [
  'TELEPHONE_CONFIRMATION',
  'APPOINTMENT_NOTIFICATION',
  'APPOINTMENT_RESPONSE',
] as const;

export type TelephoneMessageType = (typeof TELEPHONE_MESSAGE_TYPES)[number];

type TelephoneConfirmationMessage = Readonly<{
  type: 'TELEPHONE_CONFIRMATION';
  actorId: string;
  name: string;
  to: string;
  verificationId: string;
  credential: string;
  expiresAt: Date;
}>;

type AppointmentTelephoneMessage = Readonly<{
  customerId: string;
  organizationId: string;
  appointmentId: string;
  name: string;
  to: string;
  serviceIds: string[];
  datetimeInitial: Date;
  datetimeFinal: Date;
}>;

type AppointmentVerificationMessage = Readonly<{
  verificationId: string;
  credential: string;
  expiresAt: Date;
}>;

export type SendTelephoneMessageInput =
  | TelephoneConfirmationMessage
  | (AppointmentTelephoneMessage & Readonly<{
    type: 'APPOINTMENT_NOTIFICATION';
  }>)
  | (AppointmentTelephoneMessage & AppointmentVerificationMessage & Readonly<{
    type: 'APPOINTMENT_RESPONSE';
  }>);

export interface SendTelefoneMessagePort {
  sendMessage(input: SendTelephoneMessageInput): Promise<void>;
}
