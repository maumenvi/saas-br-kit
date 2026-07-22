import type { Actor, UserActor } from '../../../core/entities/actor/actor.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import { ActorDataValidationService } from '../../../core/entities/actor/services/actor.data.validation.service.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { composeActorChangeStatus } from './actor.change.status.composition.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';
import { composeActorCreate } from './actor.create.composition.ts';
import {
  composeActorFindByEmail,
  composeActorFindById,
  composeActorFindByName,
  composeActorFindByTelephone,
} from './actor.find.composition.ts';
import { composeActorUpdate } from './actor.update.composition.ts';

export class ActorComposition<ActorsStatus, Extra = unknown> {
  readonly create: Handler<Actor<ActorsStatus, Extra>, void>;
  readonly update: Handler<Actor<ActorsStatus, Extra>, void>;
  readonly changeStatus: Handler<Actor<ActorsStatus, Extra>, void>;
  readonly findById: Handler<string, Actor<ActorsStatus, Extra> | null>;
  readonly findByEmail: Handler<string, UserActor<ActorsStatus, Extra> | null>;
  readonly findByTelephone: Handler<string, UserActor<ActorsStatus, Extra> | null>;
  readonly findByName: Handler<string, Actor<ActorsStatus, Extra>[]>;
  readonly validationQuery: ActorValidationQueryPort;
  readonly logger: LoggerPort;

  constructor(input: ActorCompositionInput<ActorsStatus, Extra>) {
    this.logger = input.executionContext.loggerProvider;
    this.create = composeActorCreate(input);
    this.update = composeActorUpdate(input);
    this.changeStatus = composeActorChangeStatus(input);
    this.findById = composeActorFindById(input);
    this.findByEmail = composeActorFindByEmail(input);
    this.findByTelephone = composeActorFindByTelephone(input);
    this.findByName = composeActorFindByName(input);

    this.validationQuery = new ActorDataValidationService(
      input.actorRepository,
      input.policy.actorStatusPolicy,
    );
  }
}
