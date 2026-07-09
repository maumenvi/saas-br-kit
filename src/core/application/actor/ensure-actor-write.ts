import type { ExecutionContext } from "../../context/execution-context.ts";
import { executionPolicy } from "../shared/index.ts";

export const ensureActorWrite = (executionContext: ExecutionContext) =>
  executionPolicy.ensurePermission(executionContext, "actors:write");
