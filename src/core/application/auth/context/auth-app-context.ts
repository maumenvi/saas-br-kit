import type { AppContext } from "../../../context/app-context.ts";
import type {
  AccessTokenServicePort,
  EmailNotificationPort,
  IdentityAuthenticatorPort,
  MembershipRepositoryPort,
  OrganizationRepositoryPort,
  PasswordHasherPort,
  PasswordResetTokenStorePort,
  RefreshTokenStorePort,
  SessionManagerPort,
  UserCredentialsRepositoryPort,
  UserRepositoryPort,
} from "../../../ports/index.ts";

export type AuthAppContext = AppContext &
  Readonly<{
    auth: Readonly<{
      accessTokens: AccessTokenServicePort;
      identityAuthenticator?: IdentityAuthenticatorPort;
      passwordHasher: PasswordHasherPort;
      passwordResetTokens?: PasswordResetTokenStorePort;
      refreshTokens: RefreshTokenStorePort;
      sessionManager: SessionManagerPort;
      userCredentials: UserCredentialsRepositoryPort;
      users: UserRepositoryPort;
    }>;
    notifications?: Readonly<{
      email?: EmailNotificationPort;
    }>;
    tenantAccess?: Readonly<{
      memberships: MembershipRepositoryPort;
      organizations: OrganizationRepositoryPort;
    }>;
  }>;
