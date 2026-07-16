import type { DatabasePort } from "../ports/database.port.ts";
import type { LoggerPort } from "../ports/logger.port.ts";
import type { ClockPort } from '../ports/clock.port.ts';
import type { IdGeneratorPort } from '../ports/id-generator.port.ts';
import type { PasswordHashPort } from '../ports/password.hash.port.ts';

export type ExecutionContextInput = {
  databaseProvider: DatabasePort;
  loggerProvider: LoggerPort;
  passwordHashProvider: PasswordHashPort;
  clock?: ClockPort;
  idGenerator?: IdGeneratorPort
};

export class ExecutionContext {
  public databaseProvider: DatabasePort;
  public loggerProvider: LoggerPort;
  public passwordHashProvider: PasswordHashPort;
  public clock?: ClockPort;
  public idGenerator?: IdGeneratorPort;

  constructor(input: ExecutionContextInput) {
    this.databaseProvider = input.databaseProvider;
    this.loggerProvider = input.loggerProvider;
    this.passwordHashProvider = input.passwordHashProvider;
    this.clock = input.clock ?? (() => new Date());
    this.idGenerator = input.idGenerator ?? (() => crypto.randomUUID());
  }
}
