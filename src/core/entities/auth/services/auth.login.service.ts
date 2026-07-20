import type { AuthenticatedActor, AuthPort } from '../auth.port.ts';
import type { LoginAuth } from '../domain/auth.login.ts';
import type { ActorRepositoryPort } from '../../actor/actor.repositories.ts';
import type { PasswordHashPort } from '../../../ports/password.hash.port.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';

export class AuthLoginService implements AuthPort<LoginAuth> {
  private readonly executionContext: ExecutionContext;
  private readonly actorRepositoryPort: Pick<ActorRepositoryPort<unknown, unknown>, 'findByEmail'>;
  private readonly passwordHashPort: Pick<PasswordHashPort, 'verify'>;

  constructor(
    executionContext: ExecutionContext,
    actorRepositoryPort: Pick<ActorRepositoryPort<unknown, unknown>, 'findByEmail'>,
    passwordHashPort: Pick<PasswordHashPort, 'verify'>,
  ) {
    this.executionContext = executionContext;
    this.actorRepositoryPort = actorRepositoryPort;
    this.passwordHashPort = passwordHashPort;
  }

  async authenticate(auth: LoginAuth): Promise<AuthenticatedActor | null> {
    const actor = await this.executionContext.databaseProvider.run(async () => {
      return await this.actorRepositoryPort.findByEmail(auth.email);
    });

    if (!actor) return null;

    const verified = await this.passwordHashPort.verify(auth.password, actor.passwordHash);
    if (!verified) return null;

    return {
      actorId: actor.id,
      actorType: actor.type,
    };
  }
}
