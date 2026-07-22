import type {
  OrganizationRegistrationInput,
  OrganizationRegistrationOutput,
} from '../../../core/entities/organization/application/organization.registration.input.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { composeRegistrationCreateOrganization } from './registration.create.organization.composition.ts';
import type { RegistrationCompositionInput } from './registration.composition.input.ts';

export class RegistrationComposition<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
> {
  readonly createOrganization: Handler<
    OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
    OrganizationRegistrationOutput
  >;
  readonly logger: LoggerPort;

  constructor(
    input: RegistrationCompositionInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
  ) {
    this.logger = input.executionContext.loggerProvider;

    this.createOrganization = composeRegistrationCreateOrganization(input);
  }
}
