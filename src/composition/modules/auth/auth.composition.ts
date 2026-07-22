import type { Authentication } from '../../../core/context/app.context.ts';
import {
  AuthUseCase,
  type AuthOutput,
  type AuthServices,
  type AuthType,
  type ExecuteAuthUseCaseInput,
} from '../../../core/entities/auth/application/auth.authorize.ts';
import type { AuthInputMap } from '../../../core/entities/auth/auth.ts';
import { AuthApiKeyService } from '../../../core/entities/auth/services/auth.api-key.service.ts';
import { AuthCredentialsService } from '../../../core/entities/auth/services/auth.credentials.service.ts';
import { AuthLoginService } from '../../../core/entities/auth/services/auth.login.service.ts';
import { AuthOAuthService } from '../../../core/entities/auth/services/auth.oauth.service.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { AuthCompositionInput } from './auth.composition.input.ts';

export class AuthComposition<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> {
  readonly authenticate: Handler<
    ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
    AuthOutput<Output, MembershipStatus, MembershipExtra>
  >;
  readonly logger: LoggerPort;

  constructor(
    input: AuthCompositionInput<
      Output,
      Type,
      CustomAuth,
      MembershipStatus,
      MembershipExtra
    >,
  ) {
    this.logger = input.executionContext.loggerProvider;
    this.authenticate = this.composeAuthenticate(input);
  }

  private composeAuthenticate(
    input: AuthCompositionInput<
      Output,
      Type,
      CustomAuth,
      MembershipStatus,
      MembershipExtra
    >,
  ): Handler<
    ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
    AuthOutput<Output, MembershipStatus, MembershipExtra>
  > {
    const useCase = new AuthUseCase<
      Output,
      Type,
      CustomAuth,
      MembershipStatus,
      MembershipExtra
    >({
      services: this.composeServices(input),
      type: input.authentication.type,
      tokenPort: input.authentication.tokenPort,
      membershipRepository: input.membershipRepository,
    });

    return withDefaultInterceptors(useCase.execute.bind(useCase), {
      action: 'auth:authenticate',
      ...input,
      identityResolver: (request, output) => ({
        actorId: output?.membership.actorId ?? null,
        organizationId:
          output?.membership.organizationId ?? request.payload.organizationId,
        membershipId: output?.membership.id ?? null,
      }),
    });
  }

  private composeServices(
    input: AuthCompositionInput<
      Output,
      Type,
      CustomAuth,
      MembershipStatus,
      MembershipExtra
    >,
  ): AuthServices<CustomAuth> {
    const authentication: Authentication<Output, AuthType, CustomAuth> =
      input.authentication;

    switch (authentication.type) {
      case 'LOGIN':
        return {
          LOGIN: new AuthLoginService(
            input.executionContext,
            input.actorRepositoryPort,
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
}
