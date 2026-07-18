import type { TokenPort } from '../../../ports/token.port.ts';
import type { AuthPort } from '../auth.port.ts';
import type { AuthInputMap } from '../auth.ts';
import { AuthErrors } from '../domain/auth.errors.ts';

export const AUTH_TYPES = [
  'LOGIN',
  'CREDENTIALS',
  'OAUTH',
  'API_KEY',
  'CUSTOM',
] as const;

export type AuthType = (typeof AUTH_TYPES)[number];
export type AuthServices<CustomAuth = Record<string, unknown>> = {
  [Type in AuthType]?: AuthPort<AuthInputMap<CustomAuth>[Type]>;
};

export type AuthUseCaseInput<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = {
  services: AuthServices<CustomAuth>;
  type: Type;
  tokenPort: TokenPort<Output>;
};

export type ExecuteAuthUseCaseInput<AuthenticationInput> = {
  authenticated: AuthenticationInput;
  payload: unknown;
  config: unknown;
};

export class AuthUseCase<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> {
  private readonly services: AuthServices<CustomAuth>;
  private readonly type: Type;
  private readonly tokenPort: TokenPort<Output>;

  constructor(input: AuthUseCaseInput<Output, Type, CustomAuth>) {
    this.services = input.services;
    this.type = input.type;
    this.tokenPort = input.tokenPort;
  }

  async execute(
    input: ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
  ): Promise<Output> {
    const { authenticated, payload, config } = input;
    const service = this.resolveAuthService();

    const isAuth = await service.authenticate(authenticated);
    if (!isAuth) {
      throw AuthErrors.authFailed();
    }

    return await this.tokenPort.createToken(payload, config);
  }

  private resolveAuthService(): AuthPort<AuthInputMap<CustomAuth>[Type]> {
    const service = this.services[this.type] as
      | AuthPort<AuthInputMap<CustomAuth>[Type]>
      | undefined;

    if (!service) {
      throw AuthErrors.invalidType();
    }

    return service;
  }
}
