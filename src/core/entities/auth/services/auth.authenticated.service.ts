import type { AuthPort } from '../auth.port.ts';
import type { Auth } from '../auth.ts';
import type { UserRepositoryPort } from '../../user/user.repositories.ts';
import type { PasswordHashPort } from '../../../ports/password.hash.port.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class AuthAuthenticatedService implements AuthPort {
  async authenticate(
    auth: Auth,
    executionContext: ExecutionContext,
    userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>,
    passwordHashPort: Pick<PasswordHashPort, 'verify'>
  ): Promise<boolean> {
    const user = await executionContext.databaseProvider.run(async () => {
      return await userRepositoryPort.findByEmail(auth.email);
    });

    const verified = user && await passwordHashPort.verify(auth.password, user.passwordHash);
    return verified || false;
  }
}
