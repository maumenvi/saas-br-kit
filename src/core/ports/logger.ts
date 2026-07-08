export type SafeLogContext = Readonly<Record<string, unknown>>;

export const REDACTED_LOG_VALUE = "[REDACTED]";

const SENSITIVE_LOG_FIELD_NAMES = new Set([
  "authorization",
  "cookie",
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "secret",
  "clientsecret",
  "connectionstring",
  "payload",
  "rawpayload",
  "webhookpayload",
]);

export type LoggerPort = Readonly<{
  debug(message: string, context?: SafeLogContext): void;
  info(message: string, context?: SafeLogContext): void;
  warn(message: string, context?: SafeLogContext): void;
  error(message: string, context?: SafeLogContext): void;
}>;

/**
 * Sanitizes log context objects before they reach a concrete logger adapter.
 */
export class LogSanitizer {
  /**
   * Detects fields that must be redacted from logs.
   */
  isSensitiveField(field: string): boolean {
    return SENSITIVE_LOG_FIELD_NAMES.has(this.normalizeFieldName(field));
  }

  /**
   * Returns a frozen copy of the context with sensitive values redacted.
   */
  sanitize(context: SafeLogContext | undefined): SafeLogContext | undefined {
    if (context === undefined) {
      return undefined;
    }

    return this.sanitizeValue(context, undefined, new WeakSet()) as SafeLogContext;
  }

  /**
   * Normalizes a field name so variants like access_token and accessToken match.
   */
  private normalizeFieldName(field: string): string {
    return field.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
  }

  /**
   * Recursively redacts sensitive data while preserving safe log structure.
   */
  private sanitizeValue(value: unknown, field: string | undefined, seen: WeakSet<object>): unknown {
    if (field !== undefined && this.isSensitiveField(field)) {
      return REDACTED_LOG_VALUE;
    }

    if (value === null || typeof value !== "object") {
      return value;
    }

    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return Object.freeze(value.map((item) => this.sanitizeValue(item, undefined, seen)));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      sanitized[key] = this.sanitizeValue(nestedValue, key, seen);
    }

    return Object.freeze(sanitized);
  }
}

/** Shared log sanitizer used by testing and runtime adapters. */
export const logSanitizer = new LogSanitizer();

/** Compatibility facade for sensitive log field detection. */
export const isSensitiveLogField = (field: string): boolean => logSanitizer.isSensitiveField(field);

/** Compatibility facade for log context sanitization. */
export const sanitizeLogContext = (
  context: SafeLogContext | undefined,
): SafeLogContext | undefined => logSanitizer.sanitize(context);
