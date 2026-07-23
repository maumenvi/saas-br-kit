import type {
  MfaCreateKeyProviderInput,
  MfaProviderPort,
  MfaValidateCodeProviderInput,
} from '../core/entities/mfa/mfa.provider.port.ts';

export class MfaProviderMock implements MfaProviderPort {
  readonly createKeyInputs: MfaCreateKeyProviderInput[] = [];
  readonly validateCodeInputs: MfaValidateCodeProviderInput[] = [];
  validCode = '123456';
  counter = 1;

  createKey(input: MfaCreateKeyProviderInput) {
    this.createKeyInputs.push(input);
    const secret = `secret-${input.label}`;
    return Promise.resolve({
      secret,
      provisioningUri:
        `otpauth://totp/${input.issuer}:${input.label}?secret=${secret}`,
      providerCredential: `protected-${secret}`,
    });
  }

  validateCode(input: MfaValidateCodeProviderInput) {
    this.validateCodeInputs.push(input);
    if (input.code !== this.validCode) {
      return Promise.resolve({ valid: false } as const);
    }
    return Promise.resolve({ valid: true, counter: this.counter } as const);
  }
}
