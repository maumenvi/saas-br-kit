import type {
  BillingWebhookParserPort,
  ParseBillingWebhookInput,
  ParsedBillingWebhookEvent,
} from "#core";
import { fail, ok, type Result } from "#core";
import { asaasWebhookMapper } from "../mappers/index.ts";

/** Parses Asaas webhook payloads into Core webhook events. */
export class AsaasWebhookParser implements BillingWebhookParserPort {
  /** Converts a stored webhook payload into a normalized billing event. */
  async parse(input: ParseBillingWebhookInput): Promise<Result<ParsedBillingWebhookEvent>> {
    try {
      return ok(asaasWebhookMapper.toParsedEvent(input.event.rawPayload));
    } catch {
      return fail({
        kind: "validation",
        code: "asaas.webhook_payload_invalid",
        message: "Asaas webhook payload could not be parsed.",
      });
    }
  }
}

/** Creates an Asaas webhook parser. */
export function createAsaasWebhookParser(): AsaasWebhookParser {
  return new AsaasWebhookParser();
}
