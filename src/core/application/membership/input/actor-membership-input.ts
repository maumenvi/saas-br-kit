import type { ExecutionContext } from "../../../context/execution-context.ts";
import type { Organization } from "../../../domain/index.ts";
import type { MembershipAppContext } from "../context/membership-app-context.ts";

export type ActorMembershipInput = Readonly<{
  appContext: MembershipAppContext;
  executionContext: ExecutionContext;
  organization: Organization;
  permission: string;
}>;
