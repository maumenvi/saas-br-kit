import type { AppContext } from "../../../context/app-context.ts";
import type { SubscriptionRepositoryPort } from "../../../ports/index.ts";

export type SubscriptionAccessAppContext = AppContext &
  Readonly<{
    repositories: Readonly<{
      subscriptions: SubscriptionRepositoryPort;
    }>;
  }>;
