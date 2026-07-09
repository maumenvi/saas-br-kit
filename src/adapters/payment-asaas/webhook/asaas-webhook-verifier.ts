import type {
  BillingWebhookVerifierPort,
  VerifyBillingWebhookInput,
  VerifyBillingWebhookOutput,
} from "#core";
import { ok, type Result } from "#core";

export type CreateAsaasWebhookVerifierInput = Readonly<{
  webhookToken?: string;
}>;

/** Verifies Asaas webhook token headers when a token is configured. */
export class AsaasWebhookVerifier implements BillingWebhookVerifierPort {
  private readonly webhookToken: string | undefined;

  /** Stores the optional token configured in Asaas webhook settings. */
  constructor(input: CreateAsaasWebhookVerifierInput = {}) {
    this.webhookToken = input.webhookToken;
  }

  /** Verifies the configured webhook token or reports unsupported verification. */
  async verify(input: VerifyBillingWebhookInput): Promise<Result<VerifyBillingWebhookOutput>> {
    if (this.webhookToken === undefined) {
      return ok({ status: "unsupported" });
    }

    const received =
      this.header(input, "asaas-webhook-token") ?? this.header(input, "x-asaas-webhook-token");

    if (received !== this.webhookToken) {
      return {
        ok: false,
        error: {
          kind: "authorization",
          code: "asaas.webhook_token_invalid",
          message: "Asaas webhook token is invalid.",
        },
      };
    }

    return ok({ status: "verified" });
  }

  private header(input: VerifyBillingWebhookInput, name: string): string | undefined {
    const headers = input.headers ?? {};
    const expected = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== expected) {
        continue;
      }
      if (typeof value === "string") {
        return value;
      }
      return value[0];
    }
    return undefined;
  }
}

/** Creates an Asaas webhook verifier. */
export function createAsaasWebhookVerifier(
  input: CreateAsaasWebhookVerifierInput = {},
): AsaasWebhookVerifier {
  return new AsaasWebhookVerifier(input);
}
