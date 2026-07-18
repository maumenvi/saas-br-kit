import type { Authentication } from '../../core/context/app.context.ts';
import type { ExecutionContext } from '../../core/context/execution.context.ts';
import {
  AuthUseCase,
  type AuthServices,
  type AuthType,
  type ExecuteAuthUseCaseInput,
} from '../../core/entities/auth/application/auth.authorize.ts';
import type { AuthInputMap } from '../../core/entities/auth/auth.ts';
import { AuthApiKeyService } from '../../core/entities/auth/services/auth.api-key.service.ts';
import { AuthCredentialsService } from '../../core/entities/auth/services/auth.credentials.service.ts';
import { AuthLoginService } from '../../core/entities/auth/services/auth.login.service.ts';
import { AuthOAuthService } from '../../core/entities/auth/services/auth.oauth.service.ts';
import type { UserRepositoryPort } from '../../core/entities/user/user.repositories.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type AuthCompositionInput<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = {
  executionContext: ExecutionContext;
  userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>;
  authentication: Authentication<Output, Type, CustomAuth>;
};

export class AuthComposition<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> {
  readonly authenticate: Handler<
    ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
    Output
  >;
  readonly logger: LoggerPort;

  constructor(input: AuthCompositionInput<Output, Type, CustomAuth>) {
    this.logger = input.executionContext.loggerProvider;
    this.authenticate = this.composeAuthenticate(input);
  }

  private composeAuthenticate(
    input: AuthCompositionInput<Output, Type, CustomAuth>,
  ): Handler<
    ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
    Output
  > {
    const useCase = new AuthUseCase<Output, Type, CustomAuth>({
      services: this.composeServices(input),
      type: input.authentication.type,
      tokenPort: input.authentication.tokenPort,
    });

    return this.defaultsInterceptors(useCase.execute.bind(useCase));
  }

  private composeServices(
    input: AuthCompositionInput<Output, Type, CustomAuth>,
  ): AuthServices<CustomAuth> {
    const authentication: Authentication<Output, AuthType, CustomAuth> =
      input.authentication;

    switch (authentication.type) {
      case 'LOGIN':
        return {
          LOGIN: new AuthLoginService(
            input.executionContext,
            input.userRepositoryPort,
            input.executionContext.passwordHashProvider,
          ),
        };
      case 'CREDENTIALS':
        return {
          CREDENTIALS: new AuthCredentialsService(authentication.service),
        };
      case 'OAUTH':
        return { OAUTH: new AuthOAuthService(authentication.service) };
      case 'API_KEY':
        return { API_KEY: new AuthApiKeyService(authentication.service) };
      case 'CUSTOM':
        return { CUSTOM: authentication.service };
    }
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
