import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  type Configuration,
  calculatePKCECodeChallenge,
  discovery,
} from "openid-client";
import { createCoreError, fail, ok } from "#core";
import type {
  OidcAuthorizationInput,
  OidcCallbackInput,
  OidcProviderPort,
  OpenIdClientProviderInput,
} from "./types.ts";

/** Generic discovery-based OIDC provider backed by openid-client. */
export class OpenIdClientOidcProvider implements OidcProviderPort {
  public readonly id: string;
  public readonly issuer: string;
  private readonly input: OpenIdClientProviderInput;
  private configuration?: Promise<Configuration>;

  constructor(input: OpenIdClientProviderInput) {
    this.id = input.id;
    this.issuer = input.issuer;
    this.input = Object.freeze({ ...input });
  }

  /** Builds an Authorization Code request with state, nonce and PKCE S256. */
  async createAuthorizationUrl(input: OidcAuthorizationInput) {
    try {
      const configuration = await this.getConfiguration();
      const codeChallenge = await calculatePKCECodeChallenge(input.codeVerifier);
      return ok(
        buildAuthorizationUrl(configuration, {
          ...this.input.authorizationParameters,
          response_type: "code",
          redirect_uri: input.redirectUri,
          scope: this.scopes().join(" "),
          state: input.state,
          nonce: input.nonce,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        }).toString(),
      );
    } catch (error) {
      return this.externalFailure("oidc.authorization_request_failed", error);
    }
  }

  /** Exchanges and validates the callback before exposing normalized identity claims. */
  async exchangeAuthorizationCode(input: OidcCallbackInput) {
    try {
      const configuration = await this.getConfiguration();
      const tokens = await authorizationCodeGrant(configuration, new URL(input.callbackUrl), {
        pkceCodeVerifier: input.codeVerifier,
        expectedState: input.expectedState,
        expectedNonce: input.expectedNonce,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (claims === undefined) {
        return fail(
          createCoreError({
            kind: "external",
            code: "oidc.id_token_missing",
            message: "OIDC provider did not return a validated ID Token.",
          }),
        );
      }
      const email = typeof claims.email === "string" ? claims.email : undefined;
      const displayName = typeof claims.name === "string" ? claims.name : undefined;
      return ok(
        Object.freeze({
          providerId: this.id,
          issuer: claims.iss,
          subject: claims.sub,
          ...(email === undefined ? {} : { email }),
          emailVerified:
            claims.email_verified === true ||
            (this.input.trustEmailVerification === true && email !== undefined),
          ...(displayName === undefined ? {} : { displayName }),
        }),
      );
    } catch (error) {
      return this.externalFailure("oidc.authorization_code_exchange_failed", error);
    }
  }

  private getConfiguration(): Promise<Configuration> {
    this.configuration ??=
      this.input.clientSecret === undefined
        ? discovery(new URL(this.issuer), this.input.clientId)
        : discovery(new URL(this.issuer), this.input.clientId, this.input.clientSecret);
    return this.configuration;
  }

  private scopes(): readonly string[] {
    return Object.freeze([
      "openid",
      ...new Set((this.input.scopes ?? ["profile", "email"]).filter((scope) => scope !== "openid")),
    ]);
  }

  private externalFailure(code: string, error: unknown) {
    return fail(
      createCoreError({
        kind: "external",
        code,
        message: "OIDC provider operation failed.",
        retryable: true,
        details: {
          cause: error instanceof Error ? { name: error.name } : { name: "UnknownError" },
        },
      }),
    );
  }
}

/** Creates a standards-based OIDC provider configurable for Google, Microsoft or another issuer. */
export function createOpenIdClientOidcProvider(input: OpenIdClientProviderInput): OidcProviderPort {
  return new OpenIdClientOidcProvider(input);
}
