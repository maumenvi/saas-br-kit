import type { Result, VerifiedFederatedIdentity } from "#core";

export type OidcAuthorizationInput = Readonly<{
  redirectUri: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}>;

export type OidcCallbackInput = Readonly<{
  callbackUrl: string;
  redirectUri: string;
  expectedState: string;
  expectedNonce: string;
  codeVerifier: string;
}>;

/** Provider-neutral protocol boundary implemented by OIDC clients and test fakes. */
export type OidcProviderPort = Readonly<{
  id: string;
  issuer: string;
  createAuthorizationUrl(input: OidcAuthorizationInput): Promise<Result<string>>;
  exchangeAuthorizationCode(input: OidcCallbackInput): Promise<Result<VerifiedFederatedIdentity>>;
}>;

export type OidcFlow = "login" | "link";

export type OidcAuthorizationTransaction = Readonly<{
  providerId: string;
  flow: OidcFlow;
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: string;
  userId?: string;
}>;

/** One-time state store required to correlate redirects and reject callback replay. */
export type OidcTransactionStorePort = Readonly<{
  save(transaction: OidcAuthorizationTransaction): Promise<void>;
  consume(state: string, at: Date): Promise<OidcAuthorizationTransaction | null>;
}>;

export type OpenIdClientProviderInput = Readonly<{
  id: string;
  issuer: string;
  clientId: string;
  clientSecret?: string;
  scopes?: readonly string[];
  authorizationParameters?: Readonly<Record<string, string>>;
  trustEmailVerification?: boolean;
}>;
