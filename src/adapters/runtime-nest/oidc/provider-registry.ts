import type { OidcProviderPort } from "./types.ts";

/** Resolves configured providers by stable route identifier. */
export class OidcProviderRegistry {
  private readonly providers: ReadonlyMap<string, OidcProviderPort>;

  constructor(providers: readonly OidcProviderPort[]) {
    const entries = new Map<string, OidcProviderPort>();
    for (const provider of providers) {
      if (entries.has(provider.id)) {
        throw new Error(`OIDC provider id "${provider.id}" is duplicated.`);
      }
      entries.set(provider.id, provider);
    }
    this.providers = entries;
  }

  /** Returns the configured provider or undefined for an unknown route id. */
  get(providerId: string): OidcProviderPort | undefined {
    return this.providers.get(providerId);
  }
}
