import type { ExecutionContext } from "../../core/context/execution.context.ts";
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { CreateUserUseCase } from "../../core/user/application/use-cases/user.create.ts";
import type { User } from '../../core/user/application/user.input.ts';
import type { UserRepositoryPort } from "../../core/user/user.repositories.ts";
import { pipe } from '../pipe/pipe.ts';

export type UserCompositionInput<UsersStatus> = {
  executionContext: ExecutionContext;
  userRepository: UserRepositoryPort<UsersStatus>;
}

export class UserComposition<UsersStatus> {
  readonly create: Handler<User<UsersStatus>, void>;
  readonly logger: LoggerPort;

  constructor(input: UserCompositionInput<UsersStatus>) {
    const createUseCase = new CreateUserUseCase(
      input.executionContext,
      input.userRepository
    )
    this.logger = input.executionContext.loggerProvider;
    this.create = this.composeCreate(input);
  }

  private composeCreate(input: UserCompositionInput<UsersStatus>): Handler<User<UsersStatus>, void> {
    const useCase = new CreateUserUseCase(
      input.executionContext,
      input.userRepository
    )

    return this.defaultsInterceptors(useCase.execute.bind(useCase))
  }

  private defaultsInterceptors<Input, Output>(handler: Handler<Input, Output>): Handler<Input, Output> {
    return pipe(
      handler,
      new ErrorIntercept<Input, Output>(this.logger)
    )
  }
}
