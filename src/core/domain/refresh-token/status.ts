export const REFRESH_TOKEN_SESSION_STATUSES = ["active", "rotated", "revoked"] as const;

export type RefreshTokenSessionStatus = (typeof REFRESH_TOKEN_SESSION_STATUSES)[number];
