export type MfaCreateKeyProviderInput = Readonly<{
  issuer: string;
  label: string;
}>;

export type MfaGeneratedKey = Readonly<{
  secret: string;
  provisioningUri: string;
  providerCredential: string;
}>;

export type MfaValidateCodeProviderInput = Readonly<{
  providerCredential: string;
  code: string;
}>;

export type MfaCodeValidationResult =
  | Readonly<{ valid: false }>
  | Readonly<{ valid: true; counter: number }>;

export interface MfaProviderPort {
  createKey(input: MfaCreateKeyProviderInput): Promise<MfaGeneratedKey>;
  validateCode(
    input: MfaValidateCodeProviderInput,
  ): Promise<MfaCodeValidationResult>;
}

export type MfaConfig = Readonly<{
  issuer: string;
  provider: MfaProviderPort;
}>;
