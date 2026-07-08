import type { AppContext } from "../../../context/app-context.ts";
import type { OrganizationRepositoryPort } from "../../../ports/index.ts";

export type CreateOrganizationAppContext = AppContext &
  Readonly<{
    repositories: Readonly<{
      organizations: OrganizationRepositoryPort;
    }>;
  }>;
