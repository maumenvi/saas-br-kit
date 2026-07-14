import { DomainError } from "../../domain/domain.error.ts";
import type { LoggerPort } from "../ports/logger.port.ts";
import type { Handler, Interceptor } from './handler.ts';


export class ErrorIntercept<Input, Output> implements Interceptor<Input, Output> {

  private readonly logger: LoggerPort;

  constructor(logger: LoggerPort) {
    this.logger = logger;
  }

  async intercept(input: Input, next: Handler<Input, Output>): Promise<Output> {
    try {
      return await next(input);
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        this.logger.error(error.message, {
          code: error.code,
          target: error.target,
          details: error.details,
        });
      } else if (error instanceof Error) this.logger.error(error.message, error);
      else this.logger.error("Unknown error", error);
      throw error;
    }
  }
}
