import type {
  OrganizationRegistrationInput,
  OrganizationRegistrationOutput,
} from '../../../core/entities/organization/application/organization.registration.input.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import type {
  ActorOrganizationNotificationInput,
  ActorVerificationNotificationInput,
} from '../../../core/entities/actor/application/actor.notification.ts';
import type { ActorVerificationInput } from '../../../core/entities/actor/application/actor.verification.ts';
import type { RequestVerificationOutput } from '../../../core/entities/verification/application/verification.request.ts';
import {
  composeActorSendEmailConfirmation,
  composeActorSendTelephoneConfirmation,
  composeActorSendOrganizationWelcomeEmail,
} from '../actor/actor.notification.composition.ts';
import {
  composeActorRequestEmailConfirmation,
  composeActorRequestTelephoneConfirmation,
} from '../actor/actor.verification.composition.ts';
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
  readonly sendOrganizationWelcomeEmail: Handler<
    ActorOrganizationNotificationInput,
    void
  >;
  readonly requestEmailConfirmation: Handler<ActorVerificationInput, RequestVerificationOutput>;
  readonly requestTelephoneConfirmation: Handler<ActorVerificationInput, RequestVerificationOutput>;
  readonly sendEmailConfirmation: Handler<ActorVerificationNotificationInput, void>;
  readonly sendTelephoneConfirmation: Handler<ActorVerificationNotificationInput, void>;
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
    const actorNotificationInput = {
      executionContext: input.executionContext,
      actorRepository: input.actorRepository,
      auditRepository: input.auditRepository,
      verificationRepository: input.verificationRepository,
      verification: input.verification,
      policy: {
        actorStatusPolicy: input.policy.actorStatusPolicy,
      },
    };
    this.sendOrganizationWelcomeEmail =
      composeActorSendOrganizationWelcomeEmail(actorNotificationInput);
    this.requestEmailConfirmation =
      composeActorRequestEmailConfirmation(actorNotificationInput);
    this.requestTelephoneConfirmation =
      composeActorRequestTelephoneConfirmation(actorNotificationInput);
    this.sendEmailConfirmation =
      composeActorSendEmailConfirmation(actorNotificationInput);
    this.sendTelephoneConfirmation =
      composeActorSendTelephoneConfirmation(actorNotificationInput);
  }
}
