import { BadRequestException } from "@nestjs/common";
import type { ContractSchema } from "#contracts";

/** Validates request bodies with SDK dependency-free contract schemas. */
export class NestContractValidation {
  /** Returns validated input or throws a 400 with normalized validation issues. */
  parse<TValue>(schema: ContractSchema<TValue>, value: unknown): TValue {
    const result = schema.validate(value);
    if (result.ok) {
      return result.value;
    }

    throw new BadRequestException({
      error: {
        kind: "validation",
        code: "request.body_invalid",
        message: "Request body is invalid.",
        issues: result.issues,
      },
    });
  }
}

export const nestContractValidation = new NestContractValidation();
