import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  type HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { CoreError, Result } from "#core";

/** Maps Core Result failures to HTTP exceptions at the Nest boundary. */
export class NestHttpErrorMapper {
  /** Returns successful data or throws an HTTP exception for Core failures. */
  unwrap<TValue>(result: Result<TValue, CoreError>): TValue {
    if (result.ok) {
      return result.data;
    }
    throw this.toException(result.error);
  }

  /** Converts a Core error to a concrete Nest HTTP exception. */
  toException(error: CoreError): HttpException {
    const body = {
      error: {
        kind: error.kind,
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    };

    switch (error.kind) {
      case "validation":
      case "domain":
        return new BadRequestException(body);
      case "authorization":
        return new ForbiddenException(body);
      case "not_found":
        return new NotFoundException(body);
      case "conflict":
        return new ConflictException(body);
      case "external":
      case "infrastructure":
        return new ServiceUnavailableException(body);
    }
  }
}

export const nestHttpErrorMapper = new NestHttpErrorMapper();
