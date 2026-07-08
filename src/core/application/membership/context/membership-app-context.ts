import type { AppContext } from "../../../context/app-context.ts";
import type {
  EmailNotificationPort,
  MembershipRepositoryPort,
  OrganizationRepositoryPort,
  UserRepositoryPort,
} from "../../../ports/index.ts";

export type MembershipAppContext = AppContext &
  Readonly<{
    auth?: Readonly<{
      users?: UserRepositoryPort;
    }>;
    notifications?: Readonly<{
      email?: EmailNotificationPort;
    }>;
    repositories: Readonly<{
      memberships: MembershipRepositoryPort;
      organizations: OrganizationRepositoryPort;
    }>;
  }>;
