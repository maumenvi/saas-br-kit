import type { TransactionScope } from "../transaction-manager.ts";

export type RepositoryOperationOptions = Readonly<{
  transaction?: TransactionScope;
}>;
