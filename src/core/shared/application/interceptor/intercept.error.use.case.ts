import { DomainError } from "../../domain/domain.error.ts";
import type { LoggerPort } from "../ports/logger.port.ts";
import type { UseCase } from "../use.case.ts";

export class InterceptErrorUseCase<Input, Output> implements UseCase<Input, Output> {
  private readonly useCase: UseCase<Input, Output>;
  private readonly logger: LoggerPort;

  constructor(
    useCase: UseCase<Input, Output>,
    logger: LoggerPort,
  ) {
    this.useCase = useCase;
    this.logger = logger;
  }

  async execute(input: Input): Promise<Output> {
    try {
      return await this.useCase.execute(input);
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
