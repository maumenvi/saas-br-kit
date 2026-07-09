import { fail, ok, type Result } from "../../errors/result.ts";
import { createDomainValidationError } from "../validation/index.ts";
import type { WebhookEventPayload } from "./types.ts";

/**
 * Normalizes webhook event inputs while keeping raw payloads immutable.
 */
export class WebhookEventInputNormalizer {
  /**
   * Freezes object payloads and preserves string payloads as-is.
   */
  freezePayload(rawPayload: WebhookEventPayload): WebhookEventPayload {
    return typeof rawPayload === "string" ? rawPayload : Object.freeze({ ...rawPayload });
  }

  /**
   * Ensures the persisted processing attempt count is a non-negative integer.
   */
  validateProcessingAttempts(value: number): Result<number> {
    if (!Number.isInteger(value) || value < 0) {
      return fail(
        createDomainValidationError(
          "webhookEvent.processingAttempts.invalid",
          "webhookEvent.processingAttempts must be a non-negative integer.",
        ),
      );
    }

    return ok(value);
  }
}

/** Shared webhook input normalizer used by webhook event entities. */
export const webhookEventInputNormalizer = new WebhookEventInputNormalizer();
