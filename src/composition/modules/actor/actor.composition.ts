import type { Actor, UserActor } from '../../../core/entities/actor/actor.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import { ActorDataValidationService } from '../../../core/entities/actor/services/actor.data.validation.service.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import type {
  ActorOrganizationNotificationInput,
  ActorOrganizationVerificationNotificationInput,
  ActorVerificationNotificationInput,
} from '../../../core/entities/actor/application/actor.notification.ts';
import type { ActorVerificationInput } from '../../../core/entities/actor/application/actor.verification.ts';
import type { RequestVerificationOutput } from '../../../core/entities/verification/application/verification.request.ts';
import { composeActorChangeStatus } from './actor.change.status.composition.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';
import { composeActorCreate } from './actor.create.composition.ts';
import {
  composeActorFindByEmail,
  composeActorFindById,
  composeActorFindByName,
  composeActorFindByTelephone,
} from './actor.find.composition.ts';
import {
  composeActorSendEmailConfirmation,
  composeActorSendTelephoneConfirmation,
  composeActorSendOrganizationInvitationEmail,
  composeActorSendOrganizationWelcomeEmail,
} from './actor.notification.composition.ts';
import {
  composeActorRequestEmailConfirmation,
  composeActorRequestTelephoneConfirmation,
} from './actor.verification.composition.ts';
import { composeActorUpdate } from './actor.update.composition.ts';

export class ActorComposition<
  ActorsStatus,
  ActorExtra = unknown,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> {
  readonly create: Handler<Actor<ActorsStatus, ActorExtra>, void>;
  readonly update: Handler<Actor<ActorsStatus, ActorExtra>, void>;
  readonly changeStatus: Handler<Actor<ActorsStatus, ActorExtra>, void>;
  readonly findById: Handler<string, Actor<ActorsStatus, ActorExtra> | null>;
  readonly findByEmail: Handler<string, UserActor<ActorsStatus, ActorExtra> | null>;
  readonly findByTelephone: Handler<string, UserActor<ActorsStatus, ActorExtra> | null>;
  readonly findByName: Handler<string, Actor<ActorsStatus, ActorExtra>[]>;
  readonly sendOrganizationWelcomeEmail: Handler<
    ActorOrganizationNotificationInput,
    void
  >;
  readonly sendOrganizationInvitationEmail: Handler<
    ActorOrganizationVerificationNotificationInput,
    void
  >;
  readonly requestEmailConfirmation: Handler<ActorVerificationInput, RequestVerificationOutput>;
  readonly requestTelephoneConfirmation: Handler<ActorVerificationInput, RequestVerificationOutput>;
  readonly sendEmailConfirmation: Handler<ActorVerificationNotificationInput, void>;
  readonly sendTelephoneConfirmation: Handler<ActorVerificationNotificationInput, void>;
  readonly validationQuery: ActorValidationQueryPort;
  readonly logger: LoggerPort;

  constructor(
    input: ActorCompositionInput<
      ActorsStatus,
      ActorExtra,
      MembershipStatus,
      MembershipExtra
    >,
  ) {
    this.logger = input.executionContext.loggerProvider;
    this.create = composeActorCreate(input);
    this.update = composeActorUpdate(input);
    this.changeStatus = composeActorChangeStatus(input);
    this.findById = composeActorFindById(input);
    this.findByEmail = composeActorFindByEmail(input);
    this.findByTelephone = composeActorFindByTelephone(input);
    this.findByName = composeActorFindByName(input);
    this.sendOrganizationWelcomeEmail =
      composeActorSendOrganizationWelcomeEmail(input);
    this.sendOrganizationInvitationEmail =
      composeActorSendOrganizationInvitationEmail(input);
    this.requestEmailConfirmation =
      composeActorRequestEmailConfirmation(input);
    this.requestTelephoneConfirmation =
      composeActorRequestTelephoneConfirmation(input);
    this.sendEmailConfirmation = composeActorSendEmailConfirmation(input);
    this.sendTelephoneConfirmation = composeActorSendTelephoneConfirmation(input);

    this.validationQuery = new ActorDataValidationService(
      input.actorRepository,
      input.policy.actorStatusPolicy,
    );
  }
}
