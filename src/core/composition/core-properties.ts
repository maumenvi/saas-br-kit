import {
  consoleLogger,
  systemClock,
  uuidV7IdGenerator,
} from "../context/default-technical-ports.ts";
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

export type CorePropertiesInput = Readonly<{
  clock?: ClockPort;
  idGenerator?: IdGeneratorPort;
  logger?: LoggerPort;
  transactionManager?: TransactionManagerPort;
}>;

export type CorePropertiesContext = Readonly<{
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
  logger: LoggerPort;
  transactionManager?: TransactionManagerPort;
}>;

/** Creates the registration for clocks, identifiers, logging and optional transactions. */
export function coreProperties(
  input: CorePropertiesInput = {},
): CoreRegistration<"core", CorePropertiesContext, CorePropertiesContext> {
  const clock = input.clock ?? systemClock;
  const idGenerator = input.idGenerator ?? uuidV7IdGenerator;
  const logger = input.logger ?? consoleLogger;
  const context = Object.freeze({
    clock,
    idGenerator,
    logger,
    ...(input.transactionManager === undefined
      ? {}
      : { transactionManager: input.transactionManager }),
  });
  return new CoreRegistration({
    name: "core",
    provides: [
      clockCorePort,
      idGeneratorCorePort,
      loggerCorePort,
      ...(input.transactionManager === undefined ? [] : [transactionManagerCorePort]),
    ],
    install: (registry) => {
      registry.provide(clockCorePort, clock);
      registry.provide(idGeneratorCorePort, idGenerator);
      registry.provide(loggerCorePort, logger);
      if (input.transactionManager !== undefined) {
        registry.provide(transactionManagerCorePort, input.transactionManager);
      }
      return { context, output: context };
    },
  });
}
