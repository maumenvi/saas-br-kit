import type { AppContext } from "../../../context/app-context.ts";
import type {
  PasswordHasherPort,
  UserCredentialsRepositoryPort,
  UserRepositoryPort,
} from "../../../ports/index.ts";

export type ActorAppContext = AppContext &
  Readonly<{
    auth: Readonly<{
      passwordHasher: PasswordHasherPort;
      userCredentials: UserCredentialsRepositoryPort;
      users: UserRepositoryPort;
    }>;
  }>;
