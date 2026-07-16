import type { ExecutionContext } from "../../core/context/execution.context.ts";
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { CreateUserUseCase } from '../../core/entities/user/application/use-cases/user.create.ts';
import type { User } from '../../core/entities/user/application/user.ts';
import type { UserRepositoryPort } from '../../core/entities/user/user.repositories.ts';
import { pipe } from '../pipe/pipe.ts';

export type UserCompositionInput<UsersStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  userRepository: UserRepositoryPort<UsersStatus, Extra>;
}

export class UserComposition<UsersStatus, Extra = unknown> {
  readonly create: Handler<User<UsersStatus, Extra>, void>;
  readonly logger: LoggerPort;

  constructor(input: UserCompositionInput<UsersStatus, Extra>) {
    this.logger = input.executionContext.loggerProvider;
    this.create = this.composeCreate(input);
  }

  private composeCreate(input: UserCompositionInput<UsersStatus, Extra>): Handler<User<UsersStatus, Extra>, void> {
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
