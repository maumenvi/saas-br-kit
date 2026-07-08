import type { ClockPort } from "../ports/clock.ts";
import type { IdGeneratorPort } from "../ports/id-generator.ts";
import { type LoggerPort, type SafeLogContext, sanitizeLogContext } from "../ports/logger.ts";

/** System clock used when a host application does not provide one. */
export const systemClock: ClockPort = Object.freeze({
  now: () => new Date(),
});

/**
 * UUIDv7 generator with a Unix-millisecond prefix and RFC 9562 version/variant bits.
 */
export const uuidV7IdGenerator: IdGeneratorPort = Object.freeze({
  newId: () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const timestamp = Date.now();

    bytes[0] = Math.floor(timestamp / 2 ** 40) & 0xff;
    bytes[1] = Math.floor(timestamp / 2 ** 32) & 0xff;
    bytes[2] = Math.floor(timestamp / 2 ** 24) & 0xff;
    bytes[3] = Math.floor(timestamp / 2 ** 16) & 0xff;
    bytes[4] = Math.floor(timestamp / 2 ** 8) & 0xff;
    bytes[5] = timestamp & 0xff;
    bytes[6] = 0x70 | ((bytes[6] ?? 0) & 0x0f);
    bytes[8] = 0x80 | ((bytes[8] ?? 0) & 0x3f);

    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20,
    )}-${hex.slice(20)}`;
  },
});

class ConsoleLogger implements LoggerPort {
  debug(message: string, context?: SafeLogContext): void {
    console.debug(message, sanitizeLogContext(context));
  }

  info(message: string, context?: SafeLogContext): void {
    console.log(message, sanitizeLogContext(context));
  }

  warn(message: string, context?: SafeLogContext): void {
    console.warn(message, sanitizeLogContext(context));
  }

  error(message: string, context?: SafeLogContext): void {
    console.error(message, sanitizeLogContext(context));
  }
}

/** Sanitizing console logger used when a host application does not provide one. */
export const consoleLogger: LoggerPort = Object.freeze(new ConsoleLogger());
