import { randomBytes } from "node:crypto";
import { createCoreError, fail, ok } from "#core";
import { parsePositiveDuration } from "../invitations/duration.ts";
import type { SaasBrNestOptions } from "../module/options.ts";
import { OidcProviderRegistry } from "./provider-registry.ts";
import { InMemoryOidcTransactionStore } from "./transaction-store.ts";
import type { OidcAuthorizationTransaction, OidcFlow, OidcTransactionStorePort } from "./types.ts";

const defaultTransactionTtlMs = 10 * 60_000;
const runtimes = new WeakMap<SaasBrNestOptions, OidcRuntime>();

/** Coordinates provider-neutral HTTP/OIDC state for Nest controllers. */
export class OidcRuntime {
  private readonly options: SaasBrNestOptions;
  private readonly registry: OidcProviderRegistry;
  private readonly store: OidcTransactionStorePort;
  private readonly publicBaseUrl: string;
  private readonly transactionTtlMs: number;

  constructor(options: SaasBrNestOptions) {
    this.options = options;
    const oidc = options.oidc;
    this.registry = new OidcProviderRegistry(oidc?.providers ?? []);
    this.store = oidc?.transactionStore ?? new InMemoryOidcTransactionStore();
    this.publicBaseUrl = (oidc?.publicBaseUrl ?? process.env.OIDC_PUBLIC_BASE_URL ?? "").replace(
      /\/+$/,
      "",
    );
    this.transactionTtlMs =
      oidc?.transactionTtlMs ??
      (process.env.OIDC_TRANSACTION_TTL === undefined
        ? defaultTransactionTtlMs
        : parsePositiveDuration(process.env.OIDC_TRANSACTION_TTL, "OIDC_TRANSACTION_TTL"));
  }

  /** Starts login or explicit-link authorization and stores its one-time correlation data. */
  async start(providerId: string, flow: OidcFlow, userId?: string) {
    const provider = this.registry.get(providerId);
    if (provider === undefined) {
      return fail(
        createCoreError({
          kind: "not_found",
          code: "oidc.provider_not_found",
          message: "OIDC provider is not configured.",
        }),
      );
    }
    if (this.publicBaseUrl.length === 0) {
      return fail(
        createCoreError({
          kind: "infrastructure",
          code: "oidc.public_base_url_missing",
          message: "OIDC_PUBLIC_BASE_URL is required.",
        }),
      );
    }
    const now = this.options.appContext.clock.now();
    const redirectUri = `${this.publicBaseUrl}/auth/oidc/${encodeURIComponent(providerId)}/callback`;
    const transaction: OidcAuthorizationTransaction = Object.freeze({
      providerId,
      flow,
      state: this.randomSecret(),
      nonce: this.randomSecret(),
      codeVerifier: this.randomSecret(64),
      redirectUri,
      expiresAt: new Date(now.getTime() + this.transactionTtlMs).toISOString(),
      ...(userId === undefined ? {} : { userId }),
    });
    await this.store.save(transaction);
    const authorizationUrl = await provider.createAuthorizationUrl(transaction);
    return authorizationUrl.ok
      ? ok(Object.freeze({ authorizationUrl: authorizationUrl.data }))
      : authorizationUrl;
  }

  /** Consumes callback state and asks the configured provider to validate code and ID Token. */
  async complete(providerId: string, query: Readonly<Record<string, string | undefined>>) {
    const state = query.state;
    if (state === undefined || state.length === 0) {
      return fail(
        createCoreError({
          kind: "validation",
          code: "oidc.state_missing",
          message: "OIDC callback state is required.",
        }),
      );
    }
    const transaction = await this.store.consume(state, this.options.appContext.clock.now());
    if (transaction === null || transaction.providerId !== providerId) {
      return fail(
        createCoreError({
          kind: "authorization",
          code: "oidc.transaction_invalid",
          message: "OIDC transaction is invalid, expired or already consumed.",
        }),
      );
    }
    const provider = this.registry.get(providerId);
    if (provider === undefined) {
      return fail(
        createCoreError({
          kind: "not_found",
          code: "oidc.provider_not_found",
          message: "OIDC provider is not configured.",
        }),
      );
    }
    const callbackUrl = new URL(transaction.redirectUri);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) callbackUrl.searchParams.set(key, value);
    }
    const identity = await provider.exchangeAuthorizationCode({
      callbackUrl: callbackUrl.toString(),
      redirectUri: transaction.redirectUri,
      expectedState: transaction.state,
      expectedNonce: transaction.nonce,
      codeVerifier: transaction.codeVerifier,
    });
    if (
      identity.ok &&
      (identity.data.providerId !== provider.id || identity.data.issuer !== provider.issuer)
    ) {
      return fail(
        createCoreError({
          kind: "authorization",
          code: "oidc.provider_identity_mismatch",
          message: "OIDC provider returned an identity outside its configured boundary.",
        }),
      );
    }
    return identity.ok
      ? ok(
          Object.freeze({
            transaction,
            identity: identity.data,
          }),
        )
      : identity;
  }

  private randomSecret(bytes = 32): string {
    return randomBytes(bytes).toString("base64url");
  }
}

/** Returns the singleton OIDC runtime associated with one Nest module options object. */
export function oidcRuntimeFor(options: SaasBrNestOptions): OidcRuntime {
  const current = runtimes.get(options);
  if (current !== undefined) return current;
  const runtime = new OidcRuntime(options);
  runtimes.set(options, runtime);
  return runtime;
}
