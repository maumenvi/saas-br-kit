import type { EmailNotificationPort } from "../../ports/email-notifications.ts";
import type { LoggerPort } from "../../ports/logger.ts";

type EmailNotificationContext = Readonly<{
  logger: LoggerPort;
  notifications?: Readonly<{
    email?: EmailNotificationPort;
  }>;
}>;

export async function sendOptionalEmailNotification<
  TKey extends keyof EmailNotificationPort,
  TPayload extends Parameters<NonNullable<EmailNotificationPort[TKey]>>[0],
>(appContext: EmailNotificationContext, handlerName: TKey, payload: TPayload): Promise<void> {
  const emailAdapter = appContext.notifications?.email;
  const handler = emailAdapter?.[handlerName] as ((input: TPayload) => Promise<void>) | undefined;

  if (typeof handler !== "function") {
    appContext.logger.error("Email notification handler is not configured.", {
      handlerName,
    });
    return;
  }

  try {
    await handler(payload);
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
