import { ChangeActorStatusUseCase } from '../../../core/entities/actor/application/actor.change.status.ts';
import { CreateActorUseCase } from '../../../core/entities/actor/application/actor.create.ts';
import { FindActorUseCase } from '../../../core/entities/actor/application/actor.find.ts';
import { UpdateActorUseCase } from '../../../core/entities/actor/application/actor.update.ts';
import type { Actor, UserActor } from '../../../core/entities/actor/actor.ts';
import type { ActorValidationQueryPort } from '../../../core/entities/actor/actor.validation.query.port.ts';
import { ActorDataValidationService } from '../../../core/entities/actor/services/actor.data.validation.service.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

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
    this.create = this.composeCreate(input);
    this.update = this.composeUpdate(input);
    this.changeStatus = this.composeChangeStatus(input);
    this.findById = this.composeFindById(input);
    this.findByEmail = this.composeFindByEmail(input);
    this.findByTelephone = this.composeFindByTelephone(input);
    this.findByName = this.composeFindByName(input);

    this.validationQuery = new ActorDataValidationService(
      input.actorRepository,
      input.policy.actorStatusPolicy,
    );
  }

  private composeCreate(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<Actor<ActorsStatus, Extra>, void> {
    const useCase = new CreateActorUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.execute.bind(useCase), {
      action: 'actor:create',
      permission: 'actor:create',
      ...input,
    });
  }

  private composeUpdate(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<Actor<ActorsStatus, Extra>, void> {
    const useCase = new UpdateActorUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.update.bind(useCase), {
      action: 'actor:update',
      permission: 'actor:update',
      ...input,
    });
  }

  private composeChangeStatus(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<Actor<ActorsStatus, Extra>, void> {
    const useCase = new ChangeActorStatusUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.changeStatus.bind(useCase), {
      action: 'actor:change-status',
      permission: 'actor:change-status',
      ...input,
    });
  }

  private composeFindById(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<string, Actor<ActorsStatus, Extra> | null> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.findById.bind(useCase), {
      action: 'actor:find-by-id',
      permission: 'actor:find',
      ...input,
    });
  }

  private composeFindByEmail(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<string, UserActor<ActorsStatus, Extra> | null> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.findByEmail.bind(useCase), {
      action: 'actor:find-by-email',
      permission: 'actor:find',
      ...input,
    });
  }

  private composeFindByTelephone(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<string, UserActor<ActorsStatus, Extra> | null> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.findByTelephone.bind(useCase), {
      action: 'actor:find-by-telephone',
      permission: 'actor:find',
      ...input,
    });
  }

  private composeFindByName(
    input: ActorCompositionInput<ActorsStatus, Extra>,
  ): Handler<string, Actor<ActorsStatus, Extra>[]> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository,
    );

    return withDefaultInterceptors(useCase.findByName.bind(useCase), {
      action: 'actor:find-by-name',
      permission: 'actor:find',
      ...input,
    });
  }
}
