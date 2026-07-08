import type { UserId } from "../../domain/index.ts";
import type { Result } from "../../errors/result.ts";

export type CreateRefreshTokenSecretInput = Readonly<{
  userId: UserId;
  issuedAt: string;
  deviceId?: string;
}>;

export type CreateRefreshTokenSecretResult = Readonly<{
  secret: string;
  expiresAt: string;
}>;

export type SessionManagerPort = Readonly<{
  createRefreshTokenSecret(
    input: CreateRefreshTokenSecretInput,
  ): Promise<Result<CreateRefreshTokenSecretResult>>;
}>;
