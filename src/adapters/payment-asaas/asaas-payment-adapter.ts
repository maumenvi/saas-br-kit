import { GenericPaymentAdapter } from "#adapters/payment";
import type { AsaasClient } from "./client/index.ts";

export type AsaasPaymentAdapter = GenericPaymentAdapter<AsaasClient>;

/** Creates the official external Asaas payment adapter. */
export function asaasPaymentAdapter(client: AsaasClient): AsaasPaymentAdapter {
  return new GenericPaymentAdapter<AsaasClient>({
    name: "asaas",
    client,
    descriptor: {
      provider: "asaas",
      capabilities: ["subscription", "pix", "boleto", "webhook-verification"],
    },
    healthCheck: async (client) => {
      await client.healthCheck?.();
      return { status: "up" };
    },
  });
}
