import type { LoggerPort } from "../core/ports/logger.port.ts";

export class LoggerMock implements LoggerPort {
  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }
  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }
  info(message: string, ...args: unknown[]): void {
    console.info(message, ...args);
  }
  debug(message: string, ...args: unknown[]): void {
    console.debug(message, ...args);
  }
}
