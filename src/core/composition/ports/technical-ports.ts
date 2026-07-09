import type {
  ClockPort,
  IdGeneratorPort,
  LoggerPort,
  TransactionManagerPort,
} from "../../ports/index.ts";
import { CorePort } from "../port.ts";

/** Clock used by domain and application operations. */
export const clockCorePort = new CorePort<ClockPort>({
  id: "core.clock",
  description: "ClockPort used to obtain trusted application time.",
});

/** Generator used for identifiers created by the Core. */
export const idGeneratorCorePort = new CorePort<IdGeneratorPort>({
  id: "core.id-generator",
  description: "IdGeneratorPort used when creating domain records.",
});

/** Sanitizing logger shared by application services. */
export const loggerCorePort = new CorePort<LoggerPort>({
  id: "core.logger",
  description: "LoggerPort used for safe application diagnostics.",
});

/** Transaction boundary required by write use cases. */
export const transactionManagerCorePort = new CorePort<TransactionManagerPort>({
  id: "core.transaction-manager",
  description: "TransactionManagerPort required for atomic application operations.",
});
