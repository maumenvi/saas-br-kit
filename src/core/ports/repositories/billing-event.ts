import type { BillingEvent } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type BillingEventRepositoryPort = Readonly<{
  save(event: BillingEvent, options?: RepositoryOperationOptions): Promise<void>;
}>;
