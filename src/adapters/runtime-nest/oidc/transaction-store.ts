import { createHash } from "node:crypto";
import type { OidcAuthorizationTransaction, OidcTransactionStorePort } from "./types.ts";

/** In-memory one-time OIDC transaction store intended for demos and single-process apps. */
export class InMemoryOidcTransactionStore implements OidcTransactionStorePort {
  private readonly records = new Map<string, OidcAuthorizationTransaction>();

  /** Stores a transaction under a hash of state so raw state is not used as the map key. */
  async save(transaction: OidcAuthorizationTransaction): Promise<void> {
    this.records.set(this.hash(transaction.state), Object.freeze({ ...transaction }));
  }

  /** Atomically removes and returns a non-expired transaction. */
  async consume(state: string, at: Date): Promise<OidcAuthorizationTransaction | null> {
    const key = this.hash(state);
    const transaction = this.records.get(key);
    this.records.delete(key);
    if (transaction === undefined || Date.parse(transaction.expiresAt) <= at.getTime()) {
      return null;
    }
    return transaction;
  }

  private hash(state: string): string {
    return createHash("sha256").update(state).digest("hex");
  }
}
