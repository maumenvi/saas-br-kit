import { createHmac, timingSafeEqual } from "node:crypto";

export type InvitationTokenPayload = Readonly<{
  userId: string;
  organizationId: string;
  issuedAt: string;
  expiresAt: string;
}>;

type SerializedInvitationTokenPayload = Readonly<{
  v: 1;
  sub: string;
  org: string;
  iat: number;
  exp: number;
}>;

export class InvitationTokenError extends Error {
  readonly code: "invitation.token_invalid" | "invitation.token_expired";

  constructor(code: InvitationTokenError["code"], message: string) {
    super(message);
    this.name = "InvitationTokenError";
    this.code = code;
  }
}

/** Issues and verifies stateless HMAC invitation tokens. */
export class InvitationTokenService {
  private readonly secret: string;
  private readonly ttlMs: number;

  constructor(secret: string, ttlMs: number) {
    this.secret = secret;
    this.ttlMs = ttlMs;
  }

  /** Issues a token bound to one user and one organization. */
  issue(input: Readonly<{ userId: string; organizationId: string; issuedAt: Date }>) {
    const issuedAtMs = input.issuedAt.getTime();
    const expiresAtMs = issuedAtMs + this.ttlMs;
    const serialized: SerializedInvitationTokenPayload = Object.freeze({
      v: 1,
      sub: input.userId,
      org: input.organizationId,
      iat: Math.floor(issuedAtMs / 1_000),
      exp: Math.floor(expiresAtMs / 1_000),
    });
    const payload = Buffer.from(JSON.stringify(serialized)).toString("base64url");
    return Object.freeze({
      token: `${payload}.${this.sign(payload)}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
    });
  }

  /** Verifies signature, shape and expiration before returning invitation identity. */
  verify(token: string, now: Date): InvitationTokenPayload {
    const [payload, signature, extra] = token.split(".");
    if (payload === undefined || signature === undefined || extra !== undefined) {
      throw new InvitationTokenError("invitation.token_invalid", "Invitation token is invalid.");
    }

    const expected = Buffer.from(this.sign(payload), "base64url");
    const received = Buffer.from(signature, "base64url");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new InvitationTokenError("invitation.token_invalid", "Invitation token is invalid.");
    }

    const parsed = this.parsePayload(payload);
    if (parsed.exp <= Math.floor(now.getTime() / 1_000)) {
      throw new InvitationTokenError("invitation.token_expired", "Invitation token is expired.");
    }

    return Object.freeze({
      userId: parsed.sub,
      organizationId: parsed.org,
      issuedAt: new Date(parsed.iat * 1_000).toISOString(),
      expiresAt: new Date(parsed.exp * 1_000).toISOString(),
    });
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.secret).update(payload).digest("base64url");
  }

  private parsePayload(payload: string): SerializedInvitationTokenPayload {
    try {
      const parsed = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as Partial<SerializedInvitationTokenPayload>;
      if (
        parsed.v !== 1 ||
        typeof parsed.sub !== "string" ||
        parsed.sub.length === 0 ||
        typeof parsed.org !== "string" ||
        parsed.org.length === 0 ||
        typeof parsed.iat !== "number" ||
        !Number.isSafeInteger(parsed.iat) ||
        typeof parsed.exp !== "number" ||
        !Number.isSafeInteger(parsed.exp) ||
        parsed.exp <= parsed.iat
      ) {
        throw new Error("Invalid payload.");
      }
      return parsed as SerializedInvitationTokenPayload;
    } catch {
      throw new InvitationTokenError("invitation.token_invalid", "Invitation token is invalid.");
    }
  }
}
