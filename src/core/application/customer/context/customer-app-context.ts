import type { AppContext } from "../../../context/app-context.ts";
import type { CustomerRepositoryPort } from "../../../ports/index.ts";

export type CustomerAppContext = AppContext &
  Readonly<{ repositories: Readonly<{ customers: CustomerRepositoryPort }> }>;
