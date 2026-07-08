type EmailNotificationHandlerName =
  | "sendUserInvitationEmail"
  | "sendAccountCreatedEmail"
  | "sendPasswordResetRequestedEmail"
  | "sendPasswordChangedEmail";

type NotificationCapableContext = Readonly<{
  logger: Readonly<{
    error(message: string, context?: Readonly<Record<string, unknown>>): void;
  }>;
  notifications?: Readonly<{
    email?: object;
  }>;
}>;

export async function sendOptionalEmailNotification(
  appContext: NotificationCapableContext,
  handlerName: EmailNotificationHandlerName,
  payload: Readonly<Record<string, unknown>>,
): Promise<void> {
  const handler = (
    appContext.notifications?.email as Readonly<Record<string, unknown>> | undefined
  )?.[handlerName];
  if (typeof handler !== "function") {
    appContext.logger.error("Email notification handler is not configured.", {
      handlerName,
    });
    return;
  }

  try {
    await (handler as (input: Readonly<Record<string, unknown>>) => Promise<void>)(payload);
  } catch (error) {
    appContext.logger.error("Email notification delivery failed.", {
      handlerName,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: "Unknown email notification error." },
    });
  }
}
