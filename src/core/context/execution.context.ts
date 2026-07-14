import type { ClockPort, IdGeneratorPort } from '../index.ts';
import type { DatabasePort } from "../ports/database.port.ts";
import type { LoggerPort } from "../ports/logger.port.ts";

export type ExecutionContextInput = {
  databaseProvider: DatabasePort;
  loggerProvider: LoggerPort;
  clock?: ClockPort;
  idGenerator?: IdGeneratorPort

};

export class ExecutionContext {
  public databaseProvider: DatabasePort;
  public loggerProvider: LoggerPort;
  public clock?: ClockPort;
  public idGenerator?: IdGeneratorPort;

  constructor(input: ExecutionContextInput) {
    this.databaseProvider = input.databaseProvider;
    this.loggerProvider = input.loggerProvider;
    this.clock = input.clock ?? (() => new Date());
    this.idGenerator = input.idGenerator ?? (() => crypto.randomUUID());

  }
}
