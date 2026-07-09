import type { SaasBrNestOptions } from "../module/options.ts";
import { sendOptionalEmailNotification } from "../notifications/send-optional-email-notification.ts";
import { resolveInvitationSettings } from "./invitation-settings.ts";
import { InvitationTokenService } from "./invitation-token.ts";

type InvitationEmailInput = Readonly<{
  to: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  role: string;
  invitedByUserId?: string;
}>;

/** Issues an invitation token and dispatches the corresponding activation link. */
export async function sendOrganizationInvitationEmail(
  options: SaasBrNestOptions,
  input: InvitationEmailInput,
) {
  const settings = resolveInvitationSettings(options);
  const issuedAt = options.appContext.clock.now();
  const invitation = new InvitationTokenService(settings.tokenSecret, settings.tokenTtlMs).issue({
    userId: input.userId,
    organizationId: input.organizationId,
    issuedAt,
  });
  const activationUrl = `${settings.publicBaseUrl}/organization-invitations/accept?token=${encodeURIComponent(invitation.token)}`;

  await sendOptionalEmailNotification(
    options.appContext as SaasBrNestOptions["appContext"] & {
      notifications?: Readonly<{
        email?: Readonly<Record<string, unknown>>;
      }>;
    },
    "sendUserInvitationEmail",
    {
      to: input.to,
      organizationId: input.organizationId,
      organizationName: input.organizationName,
      role: input.role,
      invitedUserId: input.userId,
      ...(input.invitedByUserId === undefined ? {} : { invitedByUserId: input.invitedByUserId }),
      activationUrl,
      expiresAt: invitation.expiresAt,
    },
  );

  return Object.freeze({
    activationUrl,
    expiresAt: invitation.expiresAt,
  });
}
