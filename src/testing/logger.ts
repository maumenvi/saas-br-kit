import { type LoggerPort, type SafeLogContext, sanitizeLogContext } from "../core/index.ts";

export type CapturedLogLevel = "debug" | "info" | "warn" | "error";

export type CapturedLogEntry = Readonly<{
  level: CapturedLogLevel;
  message: string;
  context?: SafeLogContext;
}>;

export type InMemoryLogger = LoggerPort &
  Readonly<{
    entries: readonly CapturedLogEntry[];
    clear(): void;
  }>;

/**
 * Ignores all log calls while satisfying the logger port.
 */
export class NoopLogger implements LoggerPort {
  /** Accepts debug messages without side effects. */
  debug(message: string, context?: SafeLogContext): void {
    void message;
    void context;
  }

  /** Accepts informational messages without side effects. */
  info(message: string, context?: SafeLogContext): void {
    void message;
    void context;
  }

  /** Accepts warning messages without side effects. */
  warn(message: string, context?: SafeLogContext): void {
    void message;
    void context;
  }

  /** Accepts error messages without side effects. */
  error(message: string, context?: SafeLogContext): void {
    void message;
    void context;
  }
}

/**
 * Captures sanitized log entries for assertions in tests.
 */
export class InMemoryLoggerAdapter implements InMemoryLogger {
  readonly #entries: CapturedLogEntry[] = [];

  /** Returns an immutable snapshot of captured log entries. */
  get entries(): readonly CapturedLogEntry[] {
    return Object.freeze([...this.#entries]);
  }

  /**
   * Removes all captured entries from the logger.
   */
  clear(): void {
    this.#entries.length = 0;
  }

  /**
   * Captures one debug message with optional sanitized context.
   */
  debug(message: string, context?: SafeLogContext): void {
    this.capture("debug", message, context);
  }

  /**
   * Captures one informational message with optional sanitized context.
   */
  info(message: string, context?: SafeLogContext): void {
    this.capture("info", message, context);
  }

  /**
   * Captures one warning message with optional sanitized context.
   */
  warn(message: string, context?: SafeLogContext): void {
    this.capture("warn", message, context);
  }

  /**
   * Captures one error message with optional sanitized context.
   */
  error(message: string, context?: SafeLogContext): void {
    this.capture("error", message, context);
  }

  private capture(level: CapturedLogLevel, message: string, context?: SafeLogContext): void {
    const safeContext = this.freezeSafeLogContext(context);
    this.#entries.push(
      Object.freeze({
        level,
        message,
        ...(safeContext === undefined ? {} : { context: safeContext }),
      }),
    );
  }

  private freezeSafeLogContext(context: SafeLogContext | undefined): SafeLogContext | undefined {
    const sanitized = sanitizeLogContext(context);
    return sanitized === undefined ? undefined : Object.freeze({ ...sanitized });
  }
}

export function createNoopLogger(): LoggerPort {
  return Object.freeze(new NoopLogger());
}

export function createInMemoryLogger(): InMemoryLogger {
  return Object.freeze(new InMemoryLoggerAdapter());
}
