import type { OrganizationRepositoryPort } from "../../../ports/index.ts";
import type { AuthAppContext } from "../types.ts";

export type CreateAccountAppContext = AuthAppContext &
  Readonly<{
    repositories: Readonly<{
      organizations: OrganizationRepositoryPort;
    }>;
  }>;
