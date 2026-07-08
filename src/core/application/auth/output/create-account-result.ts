import type { Organization } from "../../../domain/index.ts";
import type { AuthResult } from "./auth-result.ts";

export type CreateAccountResult = AuthResult &
  Readonly<{
    organization: Organization;
  }>;
