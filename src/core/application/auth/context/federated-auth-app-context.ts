import type { FederatedIdentityRepositoryPort } from "../../../ports/index.ts";
import type { AuthAppContext } from "./auth-app-context.ts";

export type FederatedAuthAppContext = AuthAppContext &
  Readonly<{
    auth: AuthAppContext["auth"] &
      Readonly<{
        federatedIdentities: FederatedIdentityRepositoryPort;
      }>;
  }>;
