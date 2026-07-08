import type { MetadataValue, SafeMetadata } from "./types.ts";

/**
 * Normalizes metadata snapshots so entities never share mutable input objects.
 */
export class MetadataNormalizer {
  /**
   * Clones and freezes safe metadata, or returns undefined when none was provided.
   */
  freeze(metadata?: SafeMetadata): SafeMetadata | undefined {
    if (metadata === undefined) {
      return undefined;
    }

    return this.freezeObject(metadata);
  }

  private freezeObject(metadata: SafeMetadata): SafeMetadata {
    const output: Record<string, MetadataValue> = {};
    for (const [key, value] of Object.entries(metadata)) {
      output[key] = this.freezeValue(value);
    }
    return Object.freeze(output);
  }

  private freezeValue(value: MetadataValue): MetadataValue {
    if (Array.isArray(value)) {
      return Object.freeze(value.map((item) => this.freezeValue(item)));
    }
    if (value !== null && typeof value === "object") {
      return this.freezeObject(value as SafeMetadata);
    }
    return value;
  }
}

/** Shared metadata normalizer used by domain entity classes. */
export const metadataNormalizer = new MetadataNormalizer();

/** Compatibility facade for cloning and freezing safe metadata. */
export const freezeSafeMetadata = (metadata?: SafeMetadata): SafeMetadata | undefined =>
  metadataNormalizer.freeze(metadata);
