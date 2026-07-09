import { type CoreError, createCoreError } from "#core";

/** Converts unknown Asaas failures into sanitized Core errors. */
export class AsaasErrorMapper {
  /** Creates a Core external error without leaking credentials or raw request data. */
  toCoreError(error: unknown): CoreError {
    const status = this.readStatus(error);
    return createCoreError({
      kind: "external",
      code: "asaas.request_failed",
      message: "Asaas request failed.",
      details: {
        provider: "asaas",
        ...(status === undefined ? {} : { status }),
      },
      retryable: status === undefined || status >= 500 || status === 429,
    });
  }

  private readStatus(error: unknown): number | undefined {
    return typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
      ? error.status
      : undefined;
  }
}

export const asaasErrorMapper = new AsaasErrorMapper();
