import type { DatabasePort } from "../ports/database.port.ts";
import type { LoggerPort } from "../ports/logger.port.ts";
import type { ClockPort } from '../ports/clock.port.ts';
import type { IdGeneratorPort } from '../ports/id-generator.port.ts';
import type { PasswordHashPort } from '../ports/password.hash.port.ts';
import type { IdempotencyPort } from '../ports/idempotency.port.ts';
import type { SendTelefoneMessagePort } from '../ports/send.telefone.message.port.ts';
import type { SendEmailPort } from '../ports/send.email.port.ts';
import type { CalendarIntegrationPort } from '../ports/calendar.integration.port.ts';

export type ExecutionContextInput = {
  databaseProvider: DatabasePort;
  loggerProvider: LoggerPort;
  passwordHashProvider: PasswordHashPort;
  sendTelefoneMessagePort?: SendTelefoneMessagePort;
  sendEmailPort?: SendEmailPort;
  calendarIntegrationPort?: CalendarIntegrationPort;
  idempotencyProvider?: IdempotencyPort;
  clock?: ClockPort;
  idGenerator?: IdGeneratorPort
};

export class ExecutionContext {
  public databaseProvider: DatabasePort;
  public loggerProvider: LoggerPort;
  public passwordHashProvider: PasswordHashPort;
  public sendTelefoneMessagePort?: SendTelefoneMessagePort;
  public sendEmailPort?: SendEmailPort;
  public calendarIntegrationPort?: CalendarIntegrationPort;
  public idempotencyProvider?: IdempotencyPort;
  public clock?: ClockPort;
  public idGenerator?: IdGeneratorPort;

  constructor(input: ExecutionContextInput) {
    this.databaseProvider = input.databaseProvider;
    this.loggerProvider = input.loggerProvider;
    this.passwordHashProvider = input.passwordHashProvider;
    this.sendTelefoneMessagePort = input.sendTelefoneMessagePort;
    this.sendEmailPort = input.sendEmailPort;
    this.calendarIntegrationPort = input.calendarIntegrationPort;
    this.idempotencyProvider = input.idempotencyProvider;
    this.clock = input.clock ?? (() => new Date());
    this.idGenerator = input.idGenerator ?? (() => crypto.randomUUID());
  }
}
