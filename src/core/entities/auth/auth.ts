import type { ApiKeyAuth } from './domain/auth.api-key.ts';
import type { CredentialsAuth } from './domain/auth.credentials.ts';
import type { LoginAuth } from './domain/auth.login.ts';
import type { OAuthAuth } from './domain/auth.oauth.ts';

export type AuthInputMap<CustomAuth = Record<string, unknown>> = {
  LOGIN: LoginAuth;
  CREDENTIALS: CredentialsAuth;
  OAUTH: OAuthAuth;
  API_KEY: ApiKeyAuth;
  CUSTOM: CustomAuth;
};

/** @deprecated Use LoginAuth for login authentication data. */
export type Auth = LoginAuth;

export type AuthenticatedInput<Input, AuthenticationInput = LoginAuth> = {
  auth: AuthenticationInput;
  input: Input;
};
