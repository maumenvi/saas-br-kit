export type CreateMfaKeyInput = Readonly<{
  actorId: string;
  issuer: string;
}>;

export type CreateMfaKeyOutput = Readonly<{
  secret: string;
  provisioningUri: string;
}>;
