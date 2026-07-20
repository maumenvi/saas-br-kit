export type Payload = {
  actorId: string;
  organizationId: string;
  [key: string]: unknown;
};

export interface TokenPort<Output> {
  readonly payload: Payload;
  readonly config: unknown;
  readonly refreshPayload: unknown;
  readonly refreshConfig: unknown;

  createToken(payload: unknown, config: unknown): Output;

  generateToken(payload: unknown, config: unknown): Promise<string>;
  verifyToken(token: string): Promise<unknown>;

  generateRefreshToken(refreshPayload: unknown, refreshConfig: unknown): Promise<string>;
  verifyRefreshToken(token: string): Promise<unknown>;
}
