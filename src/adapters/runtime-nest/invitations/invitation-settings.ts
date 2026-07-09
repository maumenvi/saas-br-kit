import type { SaasBrNestOptions } from "../module/options.ts";
import { parsePositiveDuration } from "./duration.ts";

const defaultInvitationTokenTtlMs = 24 * 60 * 60 * 1_000;

export type InvitationSettings = Readonly<{
  publicBaseUrl: string;
  tokenSecret: string;
  tokenTtlMs: number;
}>;

/** Resolves trusted invitation settings from module options and environment variables. */
export function resolveInvitationSettings(options: SaasBrNestOptions): InvitationSettings {
  const publicBaseUrl =
    options.invitation?.publicBaseUrl ?? process.env.INVITATION_PUBLIC_BASE_URL?.trim();
  const tokenSecret =
    options.invitation?.tokenSecret ??
    process.env.INVITATION_TOKEN_SECRET?.trim() ??
    process.env.AUTH_TOKEN_SECRET?.trim();
  const tokenTtlMs =
    options.invitation?.tokenTtlMs ??
    (process.env.INVITATION_TOKEN_TTL === undefined
      ? defaultInvitationTokenTtlMs
      : parsePositiveDuration(process.env.INVITATION_TOKEN_TTL, "INVITATION_TOKEN_TTL"));

  if (publicBaseUrl === undefined || publicBaseUrl.length === 0) {
    throw new Error("INVITATION_PUBLIC_BASE_URL is required to create invitation links.");
  }
  if (tokenSecret === undefined || tokenSecret.length < 32) {
    throw new Error(
      "INVITATION_TOKEN_SECRET or AUTH_TOKEN_SECRET must contain at least 32 characters.",
    );
  }
  if (!Number.isSafeInteger(tokenTtlMs) || tokenTtlMs <= 0) {
    throw new Error("Invitation token TTL must be a positive safe duration.");
  }

  return Object.freeze({
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
    tokenSecret,
    tokenTtlMs,
  });
}
