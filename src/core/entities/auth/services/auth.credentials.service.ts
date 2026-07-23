import type { AuthenticatedActor, AuthPort } from '../auth.port.ts';
import type { CredentialsAuth } from '../domain/auth.credentials.ts';

export class AuthCredentialsService implements AuthPort<CredentialsAuth> {
  private readonly credentialsService: AuthPort<CredentialsAuth>;

  constructor(credentialsService: AuthPort<CredentialsAuth>) {
    this.credentialsService = credentialsService;
  }

  async authenticate(auth: CredentialsAuth): Promise<AuthenticatedActor | null> {
    return await this.credentialsService.authenticate(auth);
  }
}
