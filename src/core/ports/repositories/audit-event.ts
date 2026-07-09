import type { AuditEvent } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "./options.ts";

export type AuditEventRepositoryPort = Readonly<{
  save(event: AuditEvent, options?: RepositoryOperationOptions): Promise<void>;
}>;
