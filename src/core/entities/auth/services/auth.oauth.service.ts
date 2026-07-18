import type { AuthPort } from '../auth.port.ts';
import type { OAuthAuth } from '../domain/auth.oauth.ts';

export class AuthOAuthService implements AuthPort<OAuthAuth> {
  private readonly oauthService: AuthPort<OAuthAuth>;

  constructor(oauthService: AuthPort<OAuthAuth>) {
    this.oauthService = oauthService;
  }

  authenticate(auth: OAuthAuth): Promise<boolean> {
    return this.oauthService.authenticate(auth);
  }
}
