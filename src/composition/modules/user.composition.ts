import type { ExecutionContext } from "../../core/context/execution.context.ts";
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { ChangeUserStatusUseCase } from '../../core/entities/user/application/user.change.status.ts';
import { CreateUserUseCase } from '../../core/entities/user/application/user.create.ts';
import { FindUserByIdUseCase } from '../../core/entities/user/application/user.find.ts';
import { UpdateUserUseCase } from '../../core/entities/user/application/user.update.ts';
import type { User } from '../../core/entities/user/user.ts';
import type { UserRepositoryPort } from '../../core/entities/user/user.repositories.ts';
import { pipe } from '../pipe/pipe.ts';
import type { UserStatusPolicyPort } from '../../core/entities/user/policies/user.status.police.ts';

export type UserCompositionInput<UsersStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  userRepository: UserRepositoryPort<UsersStatus, Extra>;
  policy: {
    userStatusPolicy: UserStatusPolicyPort<UsersStatus>;
  }
}

export class UserComposition<UsersStatus, Extra = unknown> {
  readonly create: Handler<User<UsersStatus, Extra>, void>;
  readonly update: Handler<User<UsersStatus, Extra>, void>;
  readonly changeStatus: Handler<User<UsersStatus, Extra>, void>;
  readonly findById: Handler<string, User<UsersStatus, Extra> | null>;
  readonly findByEmail: Handler<string, User<UsersStatus, Extra> | null>;
  readonly findByTelephone: Handler<string, User<UsersStatus, Extra> | null>;
  readonly findByName: Handler<string, User<UsersStatus, Extra>[]>;
  readonly logger: LoggerPort;

  constructor(input: UserCompositionInput<UsersStatus, Extra>) {
    this.logger = input.executionContext.loggerProvider;
    this.create = this.composeCreate(input);
    this.update = this.composeUpdate(input);
    this.changeStatus = this.composeChangeStatus(input);
    this.findById = this.composeFindById(input);
    this.findByEmail = this.composeFindByEmail(input);
    this.findByTelephone = this.composeFindByTelephone(input);
    this.findByName = this.composeFindByName(input);
  }

  private composeCreate(input: UserCompositionInput<UsersStatus, Extra>): Handler<User<UsersStatus, Extra>, void> {
    const useCase = new CreateUserUseCase(
      input.executionContext,
      input.userRepository
    )

    return this.defaultsInterceptors(useCase.execute.bind(useCase))
  }

  private composeUpdate(input: UserCompositionInput<UsersStatus, Extra>): Handler<User<UsersStatus, Extra>, void> {
    const useCase = new UpdateUserUseCase(
      input.executionContext,
      input.userRepository
    );

    return this.defaultsInterceptors(useCase.update.bind(useCase));
  }

  private composeChangeStatus(input: UserCompositionInput<UsersStatus, Extra>): Handler<User<UsersStatus, Extra>, void> {
    const useCase = new ChangeUserStatusUseCase(
      input.executionContext,
      input.userRepository
    );

    return this.defaultsInterceptors(useCase.changeStatus.bind(useCase));
  }

  private composeFindById(input: UserCompositionInput<UsersStatus, Extra>): Handler<string, User<UsersStatus, Extra> | null> {
    const useCase = new FindUserByIdUseCase(
      input.executionContext,
      input.userRepository
    );

    return this.defaultsInterceptors(useCase.findById.bind(useCase));
  }

  private composeFindByEmail(input: UserCompositionInput<UsersStatus, Extra>): Handler<string, User<UsersStatus, Extra> | null> {
    const useCase = new FindUserByIdUseCase(
      input.executionContext,
      input.userRepository
    );

    return this.defaultsInterceptors(useCase.findByEmail.bind(useCase));
  }

  private composeFindByTelephone(input: UserCompositionInput<UsersStatus, Extra>): Handler<string, User<UsersStatus, Extra> | null> {
    const useCase = new FindUserByIdUseCase(
      input.executionContext,
      input.userRepository
    );

    return this.defaultsInterceptors(useCase.findByTelephone.bind(useCase));
  }

  private composeFindByName(input: UserCompositionInput<UsersStatus, Extra>): Handler<string, User<UsersStatus, Extra>[]> {
    const useCase = new FindUserByIdUseCase(
      input.executionContext,
      input.userRepository
    );

    return this.defaultsInterceptors(useCase.findByName.bind(useCase));
  }

  private defaultsInterceptors<Input, Output>(handler: Handler<Input, Output>): Handler<Input, Output> {
    return pipe(
      handler,
      new ErrorIntercept<Input, Output>(this.logger)
    )
  }
}
