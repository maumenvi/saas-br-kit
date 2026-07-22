export const TELEPHONE_MESSAGE_TYPES = [
  'TELEPHONE_CONFIRMATION',
] as const;

export type TelephoneMessageType = (typeof TELEPHONE_MESSAGE_TYPES)[number];

export type SendTelephoneMessageInput = Readonly<{
  type: 'TELEPHONE_CONFIRMATION';
  actorId: string;
  name: string;
  to: string;
  verificationId: string;
  credential: string;
  expiresAt: Date;
}>;

export interface SendTelefoneMessagePort {
  sendMessage(input: SendTelephoneMessageInput): Promise<void>;
}
