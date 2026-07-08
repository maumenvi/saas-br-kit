import type { ArgumentsHost, ExceptionFilter, HttpException } from "@nestjs/common";
import { Catch, HttpStatus, Logger } from "@nestjs/common";

type NestLikeRequest = Readonly<{
  method?: string;
  originalUrl?: string;
  url?: string;
}>;

type NestLikeResponse = Readonly<{
  status(code: number): NestLikeResponse;
  json(payload: unknown): void;
}>;

/** Converts uncaught runtime errors to normalized HTTP payloads while keeping diagnostics in logs. */
@Catch()
export class UnhandledExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnhandledExceptionFilter.name);

  /** Ensures every thrown error returns a structured response and includes the original cause in logs. */
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<NestLikeRequest>();
    const response = context.getResponse<NestLikeResponse>();
    const normalized = this.normalize(exception);

    if (normalized.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error("Unhandled adapter runtime error.", {
        method: request.method,
        url: request.originalUrl ?? request.url,
        status: normalized.status,
        error:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : { name: "UnknownError", message: "Non-Error exception thrown." },
      });
    }

    response.status(normalized.status).json(normalized.body);
  }

  private normalize(
    exception: unknown,
  ): Readonly<{ status: number; body: Record<string, unknown> }> {
    if (this.isHttpException(exception)) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "object" && response !== null) {
        return { status, body: response as Record<string, unknown> };
      }

      return {
        status,
        body: {
          error: {
            kind: "infrastructure",
            code: "http.exception",
            message: String(response),
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          kind: "infrastructure",
          code: "adapter.unhandled_exception",
          message: "Unhandled runtime adapter exception.",
          details:
            exception instanceof Error
              ? {
                  name: exception.name,
                  message: exception.message,
                }
              : { name: "UnknownError" },
        },
      },
    };
  }

  private isHttpException(exception: unknown): exception is HttpException {
    if (typeof exception !== "object" || exception === null) {
      return false;
    }
    return (
      "getStatus" in exception &&
      typeof (exception as { getStatus: unknown }).getStatus === "function" &&
      "getResponse" in exception &&
      typeof (exception as { getResponse: unknown }).getResponse === "function"
    );
  }
}
