export const EMAIL_MESSAGE_TYPES = [
  'ORGANIZATION_WELCOME',
  'ORGANIZATION_INVITATION',
  'EMAIL_CONFIRMATION',
  'APPOINTMENT_NOTIFICATION',
  'APPOINTMENT_RESPONSE',
] as const;

export type EmailMessageType = (typeof EMAIL_MESSAGE_TYPES)[number];

type ActorEmailMessage = Readonly<{
  actorId: string;
  name: string;
  to: string;
}>;

type OrganizationEmailMessage = ActorEmailMessage & Readonly<{
  organizationId: string;
}>;

type VerificationEmailMessage = Readonly<{
  verificationId: string;
  credential: string;
  expiresAt: Date;
}>;

type AppointmentEmailMessage = Readonly<{
  customerId: string;
  organizationId: string;
  appointmentId: string;
  name: string;
  to: string;
  serviceIds: string[];
  datetimeInitial: Date;
  datetimeFinal: Date;
}>;

export type SendEmailInput =
  | (OrganizationEmailMessage & Readonly<{
    type: 'ORGANIZATION_WELCOME';
  }>)
  | (OrganizationEmailMessage & VerificationEmailMessage & Readonly<{
    type: 'ORGANIZATION_INVITATION';
  }>)
  | (ActorEmailMessage & VerificationEmailMessage & Readonly<{
    type: 'EMAIL_CONFIRMATION';
  }>)
  | (AppointmentEmailMessage & Readonly<{
    type: 'APPOINTMENT_NOTIFICATION';
  }>)
  | (AppointmentEmailMessage & VerificationEmailMessage & Readonly<{
    type: 'APPOINTMENT_RESPONSE';
  }>);

export interface SendEmailPort {
  sendEmail(input: SendEmailInput): Promise<void>;
}
