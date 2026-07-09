import type { ApiPropertyOptions } from "@nestjs/swagger";
import type { SafeMetadataDto } from "#contracts";

export type NestSafeMetadataDto = SafeMetadataDto;

/** Shared OpenAPI schema for arbitrary JSON objects accepted by Core contracts. */
export const safeMetadataApiProperty: ApiPropertyOptions = {
  type: "object",
  description:
    "Objeto JSON livre. Aceita strings, números, booleanos, null, arrays e objetos aninhados.",
  additionalProperties: true,
  example: {
    source: "api",
    tags: ["premium", "beta"],
    preferences: { notifications: true, locale: "pt-BR" },
  },
};
