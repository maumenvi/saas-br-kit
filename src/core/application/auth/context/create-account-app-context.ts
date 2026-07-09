import type {
  OrganizationRepositoryPort,
  OrganizationWriteCapabilitiesPort,
  UserCredentialsReadCapabilitiesPort,
  UserCredentialsWriteCapabilitiesPort,
  UserReadCapabilitiesPort,
  UserWriteCapabilitiesPort,
} from "../../../ports/index.ts";
import type { AuthAppContext } from "../types.ts";

export type CreateAccountAppContext = AuthAppContext &
  Readonly<{
    auth: AuthAppContext["auth"] &
    Readonly<{
      capabilities?: Readonly<{
        users?: UserReadCapabilitiesPort & UserWriteCapabilitiesPort;
        userCredentials?:
        UserCredentialsReadCapabilitiesPort & UserCredentialsWriteCapabilitiesPort;
      }>;
    }>;
    repositories?: Readonly<{
      organizations?: OrganizationRepositoryPort;
    }>;
    capabilities?: Readonly<{
      organizations?: OrganizationWriteCapabilitiesPort;
    }>;
  }>;
