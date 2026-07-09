import type {
  AccessTokenServicePort,
  EmailNotificationPort,
  IdentityAuthenticatorPort,
  PasswordHasherPort,
  RefreshTokenStorePort,
  SessionManagerPort,
} from "../../ports/index.ts";
import { CorePort } from "../port.ts";

export const accessTokenCorePort = new CorePort<AccessTokenServicePort>({
  id: "auth.access-token",
  description: "AccessTokenServicePort that issues and verifies internal access tokens.",
});

export const passwordHasherCorePort = new CorePort<PasswordHasherPort>({
  id: "auth.password-hasher",
  description: "PasswordHasherPort that hashes and verifies local credentials.",
});

export const refreshTokenStoreCorePort = new CorePort<RefreshTokenStorePort>({
  id: "auth.refresh-token-store",
  description: "RefreshTokenStorePort that rotates and revokes internal sessions.",
});

export const sessionManagerCorePort = new CorePort<SessionManagerPort>({
  id: "auth.session-manager",
  description: "SessionManagerPort that creates opaque refresh-token secrets.",
});

export const identityAuthenticatorCorePort = new CorePort<IdentityAuthenticatorPort>({
  id: "auth.identity-authenticator",
  description: "Optional IdentityAuthenticatorPort that replaces password authentication.",
});

export const emailNotificationCorePort = new CorePort<EmailNotificationPort>({
  id: "notification.email",
  description: "EmailNotificationPort used by account, invitation and password flows.",
});
