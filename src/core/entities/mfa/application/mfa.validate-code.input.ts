export type ValidateMfaCodeInput = Readonly<{
  actorId: string;
  code: string;
}>;

export type ValidateMfaCodeOutput = Readonly<{
  valid: true;
  activated: boolean;
}>;
