import type { AuthPort } from '../auth.port.ts';
import type { ApiKeyAuth } from '../domain/auth.api-key.ts';

export class AuthApiKeyService implements AuthPort<ApiKeyAuth> {
  private readonly apiKeyService: AuthPort<ApiKeyAuth>;

  constructor(apiKeyService: AuthPort<ApiKeyAuth>) {
    this.apiKeyService = apiKeyService;
  }

  authenticate(auth: ApiKeyAuth): Promise<boolean> {
    return this.apiKeyService.authenticate(auth);
  }
}
