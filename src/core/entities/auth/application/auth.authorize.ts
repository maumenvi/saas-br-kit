import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { PasswordHashPort } from '../../../ports/password.hash.port.ts';
import type { TokenPort } from '../../../ports/token.port.ts';
import type { UserRepositoryPort } from '../../user/user.repositories.ts';
import type { AuthPort } from '../auth.port.ts';
import type { Auth } from '../auth.ts';

export type AuthUseCaseInput<Output> = {
  executionContext: ExecutionContext;
  auth: AuthPort;
  userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>;
  passwordHashPort: Pick<PasswordHashPort, 'verify'>;
  tokenPort: TokenPort<Output>;
};

export type ExecuteAuthUseCaseInput = {
  authenticated: Auth;
  payload: unknown;
  config: unknown;
};

export class AuthUseCase<Output> {
  private readonly executionContext: ExecutionContext;
  private readonly auth: AuthPort;
  private readonly userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>;
  private readonly passwordHashPort: Pick<PasswordHashPort, 'verify'>;
  private readonly tokenPort: TokenPort<Output>;

  constructor(input: AuthUseCaseInput<Output>) {
    this.executionContext = input.executionContext;
    this.auth = input.auth;
    this.userRepositoryPort = input.userRepositoryPort;
    this.passwordHashPort = input.passwordHashPort;
    this.tokenPort = input.tokenPort;
  }

  async execute(input: ExecuteAuthUseCaseInput): Promise<Output> {
    const { authenticated, payload, config } = input;

    const isAuth = await this.auth.authenticate(
      authenticated,
      this.executionContext,
      this.userRepositoryPort,
      this.passwordHashPort
    );
    if (!isAuth) {
      throw new Error('Authentication failed');
    }

    return await this.tokenPort.createToken(payload, config);
  }
}
