import type { Authentication } from '../../core/context/app.context.ts';
import type { ExecutionContext } from '../../core/context/execution.context.ts';
import type { ActorRepositoryPort } from '../../core/entities/actor/actor.repositories.ts';
import {
  AuditIntercept,
  type AuditIdentityResolver,
} from '../../core/entities/audit/audit.intercept.ts';
import type { AuditRepositoryPort } from '../../core/entities/audit/audit.repositories.ts';
import {
  AuthUseCase,
  type AuthOutput,
  type AuthServices,
  type AuthType,
  type ExecuteAuthUseCaseInput,
} from '../../core/entities/auth/application/auth.authorize.ts';
import type { MembershipRepositoryPort } from '../../core/entities/membership/membership.repositories.ts';
import type { AuthInputMap } from '../../core/entities/auth/auth.ts';
import { AuthApiKeyService } from '../../core/entities/auth/services/auth.api-key.service.ts';
import { AuthCredentialsService } from '../../core/entities/auth/services/auth.credentials.service.ts';
import { AuthLoginService } from '../../core/entities/auth/services/auth.login.service.ts';
import { AuthOAuthService } from '../../core/entities/auth/services/auth.oauth.service.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type AuthCompositionInput<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  actorRepositoryPort: Pick<ActorRepositoryPort<unknown, unknown>, 'findByEmail'>;
  membershipRepository: Pick<
    MembershipRepositoryPort<MembershipStatus, MembershipExtra>,
    'findByActorOrganizationId'
  >;
  authentication: Authentication<Output, Type, CustomAuth>;
};

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

  constructor(input: AuthCompositionInput<Output, Type, CustomAuth, MembershipStatus, MembershipExtra>) {
    this.logger = input.executionContext.loggerProvider;
    this.authenticate = this.composeAuthenticate(input);
  }

  private composeAuthenticate(
    input: AuthCompositionInput<Output, Type, CustomAuth, MembershipStatus, MembershipExtra>,
  ): Handler<
    ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
    AuthOutput<Output, MembershipStatus, MembershipExtra>
  > {
    const useCase = new AuthUseCase<Output, Type, CustomAuth, MembershipStatus, MembershipExtra>({
      services: this.composeServices(input),
      type: input.authentication.type,
      tokenPort: input.authentication.tokenPort,
      membershipRepository: input.membershipRepository,
    });

    return this.defaultsInterceptors(
      useCase.execute.bind(useCase),
      input,
      (request, output) => ({
        actorId: output?.membership.actorId ?? null,
        organizationId:
          output?.membership.organizationId ?? request.payload.organizationId,
        membershipId: output?.membership.id ?? null,
      }),
    );
  }

  private composeServices(
    input: AuthCompositionInput<Output, Type, CustomAuth, MembershipStatus, MembershipExtra>,
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

  private defaultsInterceptors<Input, Output>(
    handler: Handler<Input, Output>,
    input: {
      executionContext: ExecutionContext;
      auditRepository: AuditRepositoryPort;
    },
    identityResolver: AuditIdentityResolver<Input, Output>,
  ): Handler<Input, Output> {
    return pipe(
      handler,
      new ErrorIntercept<Input, Output>(this.logger),
      new AuditIntercept<Input, Output>({
        action: 'auth:authenticate',
        executionContext: input.executionContext,
        auditRepository: input.auditRepository,
        identityResolver,
      }),
    );
  }
}
