export type SendUserInvitationEmailInput = Readonly<{
  to: string;
  organizationId: string;
  organizationName: string;
  role: string;
  invitedUserId: string;
  invitedByUserId?: string;
}>;

export type SendAccountCreatedEmailInput = Readonly<{
  to: string;
  userId: string;
  displayName?: string;
  organizationId: string;
  organizationName: string;
  organizationSubdomain?: string;
  organizationUrl?: string;
}>;

export type SendPasswordChangedEmailInput = Readonly<{
  to: string;
  userId: string;
  displayName?: string;
  changedAt: string;
}>;

export type SendPasswordResetRequestedEmailInput = Readonly<{
  to: string;
  userId: string;
  displayName?: string;
  token: string;
  resetUrl?: string;
  expiresAt: string;
}>;

export type EmailNotificationPort = Readonly<{
  sendUserInvitationEmail?: (input: SendUserInvitationEmailInput) => Promise<void>;
  sendAccountCreatedEmail?: (input: SendAccountCreatedEmailInput) => Promise<void>;
  sendPasswordResetRequestedEmail?: (input: SendPasswordResetRequestedEmailInput) => Promise<void>;
  sendPasswordChangedEmail?: (input: SendPasswordChangedEmailInput) => Promise<void>;
}>;
