import type { AuthPort } from '../auth.port.ts';
import type { LoginAuth } from '../domain/auth.login.ts';
import type { UserRepositoryPort } from '../../user/user.repositories.ts';
import type { PasswordHashPort } from '../../../ports/password.hash.port.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class AuthLoginService implements AuthPort<LoginAuth> {
  private readonly executionContext: ExecutionContext;
  private readonly userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>;
  private readonly passwordHashPort: Pick<PasswordHashPort, 'verify'>;

  constructor(
    executionContext: ExecutionContext,
    userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>,
    passwordHashPort: Pick<PasswordHashPort, 'verify'>,
  ) {
    this.executionContext = executionContext;
    this.userRepositoryPort = userRepositoryPort;
    this.passwordHashPort = passwordHashPort;
  }

  async authenticate(auth: LoginAuth): Promise<boolean> {
    const user = await this.executionContext.databaseProvider.run(async () => {
      return await this.userRepositoryPort.findByEmail(auth.email);
    });

    const verified = user && await this.passwordHashPort.verify(
      auth.password,
      user.passwordHash,
    );
    return verified || false;
  }
}
