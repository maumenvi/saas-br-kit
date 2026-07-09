import { fail, ok, type Result } from "../../errors/result.ts";
import { domainErrorFactory } from "./errors.ts";

const planCodePattern = /^[a-z0-9][a-z0-9_-]{1,62}$/;

/**
 * Normalizes plan-specific fields such as public codes and feature labels.
 */
export class PlanNormalizer {
  /**
   * Normalizes and validates the stable public code of a plan.
   */
  code(code: string): Result<string> {
    const normalized = code.trim().toLowerCase();

    if (!planCodePattern.test(normalized)) {
      return fail(
        domainErrorFactory.validation(
          "plan.code.invalid",
          "plan.code must be lowercase and use letters, numbers, hyphen or underscore.",
        ),
      );
    }

    return ok(normalized);
  }

  /**
   * Trims feature labels and rejects labels that exceed the public contract.
   */
  features(features: readonly string[] | undefined): Result<readonly string[]> {
    const normalized = (features ?? []).map((feature) => feature.trim()).filter(Boolean);

    for (const feature of normalized) {
      if (feature.length > 120) {
        return fail(
          domainErrorFactory.validation(
            "plan.features.invalid",
            "plan.features entries must have at most 120 characters.",
          ),
        );
      }
    }

    return ok(Object.freeze([...normalized]));
  }
}

/** Shared plan normalizer used by the Plan entity class. */
export const planNormalizer = new PlanNormalizer();

/** Compatibility facade for plan code normalization. */
export const normalizePlanCode = (code: string): Result<string> => planNormalizer.code(code);

/** Compatibility facade for plan feature normalization. */
export const normalizePlanFeatures = (
  features: readonly string[] | undefined,
): Result<readonly string[]> => planNormalizer.features(features);
