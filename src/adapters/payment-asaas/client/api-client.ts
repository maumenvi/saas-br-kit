import type {
  AsaasClient,
  AsaasCustomer,
  AsaasCustomerInput,
  AsaasSubscription,
  AsaasSubscriptionInput,
} from "./types.ts";

export type CreateAsaasApiClientInput = Readonly<{
  accessToken: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
}>;

/** Minimal Asaas HTTP client used by the external payment adapter. */
export class AsaasApiClient implements AsaasClient {
  private readonly accessToken: string;

  private readonly baseUrl: string;

  private readonly fetcher: typeof fetch;

  /** Stores HTTP credentials without exposing them to SDK Core logs. */
  constructor(input: CreateAsaasApiClientInput) {
    this.accessToken = input.accessToken;
    this.baseUrl = input.baseUrl ?? "https://sandbox.asaas.com/api/v3";
    this.fetcher = input.fetcher ?? fetch;
  }

  /** Creates an Asaas customer through the official customer endpoint. */
  async createCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>("/customers", input);
  }

  /** Creates an Asaas subscription through the official subscription endpoint. */
  async createSubscription(input: AsaasSubscriptionInput): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>("/subscriptions", input);
  }

  /** Cancels an existing Asaas subscription. */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request<unknown>(
      `/subscriptions/${encodeURIComponent(subscriptionId)}`,
      undefined,
      "DELETE",
    );
  }

  /** Performs a lightweight authenticated request to verify API reachability. */
  async healthCheck(): Promise<void> {
    await this.request<unknown>("/customers?limit=1", undefined, "GET");
  }

  private async request<TOutput>(path: string, body?: unknown, method = "POST"): Promise<TOutput> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        access_token: this.accessToken,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new AsaasApiError(response.status, payload);
    }

    return payload as TOutput;
  }
}

/** Sanitized Asaas HTTP error that never stores credentials. */
export class AsaasApiError extends Error {
  /** HTTP status returned by Asaas. */
  public readonly status: number;

  /** Provider payload without request credentials. */
  public readonly payload: unknown;

  /** Stores status and sanitized provider payload. */
  constructor(status: number, payload: unknown) {
    super("Asaas API request failed.");
    this.name = "AsaasApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Creates the minimal Asaas API client used by adapter consumers. */
export function createAsaasApiClient(input: CreateAsaasApiClientInput): AsaasApiClient {
  return new AsaasApiClient(input);
}
