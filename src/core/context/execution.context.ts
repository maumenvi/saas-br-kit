import type { DatabasePort } from "../ports/database.port.ts";
import type { LoggerPort } from "../ports/logger.port.ts";
import type { ClockPort } from '../ports/clock.port.ts';
import type { IdGeneratorPort } from '../ports/id-generator.port.ts';

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
