import type {
  AccessTokenServicePort,
  EmailNotificationPort,
  IdentityAuthenticatorPort,
  PasswordHasherPort,
  RefreshTokenStorePort,
  SessionManagerPort,
} from "../ports/index.ts";
import {
  accessTokenCorePort,
  emailNotificationCorePort,
  identityAuthenticatorCorePort,
  passwordHasherCorePort,
  refreshTokenStoreCorePort,
  sessionManagerCorePort,
} from "./ports/index.ts";
import { CoreRegistration } from "./registration.ts";

export type AuthPropertiesInput = Readonly<{
  accessTokens: AccessTokenServicePort;
  passwordHasher: PasswordHasherPort;
  refreshTokens: RefreshTokenStorePort;
  sessionManager: SessionManagerPort;
  identityAuthenticator?: IdentityAuthenticatorPort;
  emailNotifications?: EmailNotificationPort;
}>;

export type AuthPropertiesContext = Readonly<{
  auth: Readonly<{
    accessTokens: AccessTokenServicePort;
    passwordHasher: PasswordHasherPort;
    refreshTokens: RefreshTokenStorePort;
    sessionManager: SessionManagerPort;
    identityAuthenticator?: IdentityAuthenticatorPort;
  }>;
  notifications?: Readonly<{ email: EmailNotificationPort }>;
}>;

/** Creates the registration for framework-independent authentication ports. */
export function authProperties(
  input: AuthPropertiesInput,
): CoreRegistration<"auth", AuthPropertiesContext, AuthPropertiesContext> {
  const accessTokens = input.accessTokens;
  const passwordHasher = input.passwordHasher;
  const refreshTokens = input.refreshTokens;
  const sessionManager = input.sessionManager;
  const identityAuthenticator = input.identityAuthenticator;
  const emailNotifications = input.emailNotifications;
  const context = Object.freeze({
    auth: Object.freeze({
      accessTokens,
      passwordHasher,
      refreshTokens,
      sessionManager,
      ...(identityAuthenticator === undefined ? {} : { identityAuthenticator }),
    }),
    ...(emailNotifications === undefined
      ? {}
      : { notifications: Object.freeze({ email: emailNotifications }) }),
  });
  return new CoreRegistration({
    name: "auth",
    provides: [
      accessTokenCorePort,
      passwordHasherCorePort,
      refreshTokenStoreCorePort,
      sessionManagerCorePort,
      ...(identityAuthenticator === undefined ? [] : [identityAuthenticatorCorePort]),
      ...(emailNotifications === undefined ? [] : [emailNotificationCorePort]),
    ],
    install: (registry) => {
      registry.provide(accessTokenCorePort, accessTokens);
      registry.provide(passwordHasherCorePort, passwordHasher);
      registry.provide(refreshTokenStoreCorePort, refreshTokens);
      registry.provide(sessionManagerCorePort, sessionManager);
      if (identityAuthenticator !== undefined) {
        registry.provide(identityAuthenticatorCorePort, identityAuthenticator);
      }
      if (emailNotifications !== undefined) {
        registry.provide(emailNotificationCorePort, emailNotifications);
      }
      return { context, output: context };
    },
  });
}
