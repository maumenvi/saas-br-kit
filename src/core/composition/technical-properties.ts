import type {
  ClockPort,
  IdGeneratorPort,
  LoggerPort,
  TransactionManagerPort,
} from "../ports/index.ts";
import {
  clockCorePort,
  idGeneratorCorePort,
  loggerCorePort,
  transactionManagerCorePort,
} from "./ports/index.ts";
import { CoreRegistration } from "./registration.ts";

export type ClockRegistrationContext = Readonly<{ clock: ClockPort }>;
export type IdGeneratorRegistrationContext = Readonly<{ idGenerator: IdGeneratorPort }>;
export type LoggerRegistrationContext = Readonly<{ logger: LoggerPort }>;
export type TransactionManagerRegistrationContext = Readonly<{
  transactionManager: TransactionManagerPort;
}>;

/** Registers the Core clock port. */
export function clock(
  port: ClockPort,
): CoreRegistration<"clock", ClockRegistrationContext, ClockPort> {
  const context = Object.freeze({ clock: port });
  return new CoreRegistration({
    name: "clock",
    provides: [clockCorePort],
    install: (registry) => {
      registry.provide(clockCorePort, port);
      return { context, output: port };
    },
  });
}

/** Registers the Core identifier generator port. */
export function idGenerator(
  port: IdGeneratorPort,
): CoreRegistration<"idGenerator", IdGeneratorRegistrationContext, IdGeneratorPort> {
  const context = Object.freeze({ idGenerator: port });
  return new CoreRegistration({
    name: "idGenerator",
    provides: [idGeneratorCorePort],
    install: (registry) => {
      registry.provide(idGeneratorCorePort, port);
      return { context, output: port };
    },
  });
}

/** Registers the Core logger port. */
export function logger(
  port: LoggerPort,
): CoreRegistration<"logger", LoggerRegistrationContext, LoggerPort> {
  const context = Object.freeze({ logger: port });
  return new CoreRegistration({
    name: "logger",
    provides: [loggerCorePort],
    install: (registry) => {
      registry.provide(loggerCorePort, port);
      return { context, output: port };
    },
  });
}

/** Registers an explicit transaction manager without requiring a database adapter. */
export function transactionManager(
  port: TransactionManagerPort,
): CoreRegistration<
  "transactionManager",
  TransactionManagerRegistrationContext,
  TransactionManagerPort
> {
  const context = Object.freeze({ transactionManager: port });
  return new CoreRegistration({
    name: "transactionManager",
    provides: [transactionManagerCorePort],
    install: (registry) => {
      registry.provide(transactionManagerCorePort, port);
      return { context, output: port };
    },
  });
}
