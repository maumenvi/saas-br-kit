import type { ExecutionContext } from '../../context/execution.context.ts';
import type { PasswordHashPort } from '../../ports/password.hash.port.ts';
import type { UserRepositoryPort } from '../user/user.repositories.ts';
import type { Auth } from './auth.ts';

export interface AuthPort {
  authenticate(
    auth: Auth,
    executionContext: ExecutionContext,
    userRepositoryPort: Pick<UserRepositoryPort<unknown, unknown>, 'findByEmail'>,
    passwordHashPort: Pick<PasswordHashPort, 'verify'>
  ): Promise<boolean>
}
