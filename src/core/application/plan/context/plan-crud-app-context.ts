import type { AppContext } from "../../../context/app-context.ts";
import type { PlanRepositoryPort } from "../../../ports/index.ts";

export type PlanCrudAppContext = AppContext &
  Readonly<{ repositories: Readonly<{ plans: PlanRepositoryPort }> }>;
