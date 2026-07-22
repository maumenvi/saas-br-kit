import type { CreateMfaKeyOutput } from '../../../core/entities/mfa/application/mfa.create-key.input.ts';
import type { ValidateMfaCodeOutput } from '../../../core/entities/mfa/application/mfa.validate-code.input.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import type { MfaCompositionInput } from './mfa.composition.input.ts';
import { composeMfaCreateKey } from './mfa.create-key.composition.ts';
import {
  composeMfaValidateCode,
  type ValidateOwnMfaCodeInput,
} from './mfa.validate-code.composition.ts';

export class MfaComposition<ActorStatus, ActorExtra = unknown> {
  readonly createKey: Handler<void, CreateMfaKeyOutput>;
  readonly validateCode: Handler<
    ValidateOwnMfaCodeInput,
    ValidateMfaCodeOutput
  >;
  readonly logger: LoggerPort;

  constructor(input: MfaCompositionInput<ActorStatus, ActorExtra>) {
    this.logger = input.executionContext.loggerProvider;
    this.createKey = composeMfaCreateKey(input);
    this.validateCode = composeMfaValidateCode(input);
  }
}
