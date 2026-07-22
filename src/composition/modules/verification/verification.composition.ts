import type {
  AcceptVerificationInput,
  AcceptVerificationOutput,
} from '../../../core/entities/verification/application/verification.accept.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { composeVerificationAccept } from './verification.accept.composition.ts';
import type { VerificationCompositionInput } from './verification.composition.input.ts';
import { composeVerificationExpirePending } from './verification.expire.composition.ts';

export class VerificationComposition<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> {
  readonly accept: Handler<AcceptVerificationInput, AcceptVerificationOutput>;
  readonly expirePending: Handler<void, number>;
  readonly logger: LoggerPort;

  constructor(
    input: VerificationCompositionInput<
      ActorStatus,
      MembershipStatus,
      ActorExtra,
      MembershipExtra
    >,
  ) {
    this.logger = input.executionContext.loggerProvider;
    this.accept = composeVerificationAccept(input);
    this.expirePending = composeVerificationExpirePending(input);
  }
}
