import type { DatabasePort } from "../ports/database.port.ts";
import type { LoggerPort } from "../ports/logger.port.ts";

export type ExecutionContextInput = {
  databaseProvider: DatabasePort;
  loggerProvider: LoggerPort;
};

export class ExecutionContext {
  public databaseProvider: DatabasePort;
  public loggerProvider: LoggerPort;

  constructor(input: ExecutionContextInput) {
    this.databaseProvider = input.databaseProvider;
    this.loggerProvider = input.loggerProvider;
  }
}
