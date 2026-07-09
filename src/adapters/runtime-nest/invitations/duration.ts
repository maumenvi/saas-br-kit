const durationPattern = /^(\d+)(ms|s|m|h|d)$/;

const durationUnits = Object.freeze({
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
});

/** Parses a positive duration such as `30m`, `24h` or `1d`. */
export function parsePositiveDuration(value: string, variableName: string): number {
  const match = durationPattern.exec(value.trim());
  if (match === null) {
    throw new Error(`${variableName} must use a positive duration such as 30m, 24h or 1d.`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof durationUnits;
  const durationMs = amount * durationUnits[unit];
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0) {
    throw new Error(`${variableName} must be a positive safe duration.`);
  }
  return durationMs;
}
