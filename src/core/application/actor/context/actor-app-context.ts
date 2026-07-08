import type { AppContext } from "../../../context/app-context.ts";
import type {
  PasswordHasherPort,
  UserCredentialsReadCapabilitiesPort,
  UserCredentialsRepositoryPort,
  UserCredentialsWriteCapabilitiesPort,
  UserReadCapabilitiesPort,
  UserRepositoryPort,
  UserWriteCapabilitiesPort,
} from "../../../ports/index.ts";

export type ActorAppContext = AppContext &
  Readonly<{
    auth: Readonly<{
      passwordHasher: PasswordHasherPort;
      userCredentials?: UserCredentialsRepositoryPort;
      users?: UserRepositoryPort;
      capabilities?: Readonly<{
        users?: UserReadCapabilitiesPort & UserWriteCapabilitiesPort;
        userCredentials?: UserCredentialsReadCapabilitiesPort &
        UserCredentialsWriteCapabilitiesPort;
      }>;
    }>;
  }>;
