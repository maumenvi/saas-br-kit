import type { VerifiedFederatedIdentity } from "../../../ports/index.ts";

export type FederatedLoginInput = VerifiedFederatedIdentity &
  Readonly<{
    deviceId?: string;
    organizationUrl?: string | null;
  }>;
