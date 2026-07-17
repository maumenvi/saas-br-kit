import type { ExecutionContext } from '../../core/context/execution.context.ts';
import {
  AuthUseCase,
  type ExecuteAuthUseCaseInput,
} from '../../core/entities/auth/application/auth.authorize.ts';
import { AuthAuthenticatedService } from '../../core/entities/auth/services/auth.authenticated.service.ts';
import type { UserRepositoryPort } from '../../core/entities/user/user.repositories.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import type { TokenPort } from '../../core/ports/token.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type AuthCompositionInput<Output> = {
  executionContext: ExecutionContext;
  userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>;
  tokenPort: TokenPort<Output>;
};

export class AuthComposition<Output> {
  readonly authenticate: Handler<ExecuteAuthUseCaseInput, Output>;
  readonly logger: LoggerPort;

  constructor(input: AuthCompositionInput<Output>) {
    this.logger = input.executionContext.loggerProvider;
    this.authenticate = this.composeAuthenticate(input);
  }

  private composeAuthenticate(
    input: AuthCompositionInput<Output>,
  ): Handler<ExecuteAuthUseCaseInput, Output> {
    const useCase = new AuthUseCase<Output>({
      executionContext: input.executionContext,
      auth: new AuthAuthenticatedService(),
      userRepositoryPort: input.userRepositoryPort,
      passwordHashPort: input.executionContext.passwordHashProvider,
      tokenPort: input.tokenPort,
    });

    return this.defaultsInterceptors(useCase.execute.bind(useCase));
  }

  private defaultsInterceptors<Input, Output>(
    handler: Handler<Input, Output>,
  ): Handler<Input, Output> {
    return pipe(
      handler,
      new ErrorIntercept<Input, Output>(this.logger),
    );
  }
}
