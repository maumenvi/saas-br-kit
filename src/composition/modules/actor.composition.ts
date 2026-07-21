import type { ExecutionContext } from "../../core/context/execution.context.ts";
import { PermissionIntercept, type PermissionContext } from '../../core/access-control/permission.intercept.ts';
import type { PermissionKey } from '../../core/access-control/permission.catalog.ts';
import { AuditIntercept } from '../../core/entities/audit/audit.intercept.ts';
import type { AuditRepositoryPort } from '../../core/entities/audit/audit.repositories.ts';
import { ChangeActorStatusUseCase } from '../../core/entities/actor/application/actor.change.status.ts';
import { CreateActorUseCase } from '../../core/entities/actor/application/actor.create.ts';
import { FindActorUseCase } from '../../core/entities/actor/application/actor.find.ts';
import { UpdateActorUseCase } from '../../core/entities/actor/application/actor.update.ts';
import type { Actor, UserActor } from '../../core/entities/actor/actor.ts';
import type { ActorRepositoryPort } from '../../core/entities/actor/actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../../core/entities/actor/policies/actor.status.police.ts';
import { ActorDataValidationService } from '../../core/entities/actor/services/actor.data.validation.service.ts';
import type { ActorValidationQueryPort } from '../../core/entities/actor/actor.validation.query.port.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type ActorCompositionInput<ActorsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorsStatus, Extra>;
  auditRepository: AuditRepositoryPort;
  policy: {
    actorStatusPolicy: ActorStatusPolicyPort<ActorsStatus>;
  };
  permissionContext?: PermissionContext;
}

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
      input.policy.actorStatusPolicy
    );
  }

  private composeCreate(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<Actor<ActorsStatus, Extra>, void> {
    const useCase = new CreateActorUseCase(
      input.executionContext,
      input.actorRepository
    )

    return this.defaultsInterceptors(useCase.execute.bind(useCase), input, 'actor:create', 'actor:create')
  }

  private composeUpdate(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<Actor<ActorsStatus, Extra>, void> {
    const useCase = new UpdateActorUseCase(
      input.executionContext,
      input.actorRepository
    );

    return this.defaultsInterceptors(useCase.update.bind(useCase), input, 'actor:update', 'actor:update');
  }

  private composeChangeStatus(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<Actor<ActorsStatus, Extra>, void> {
    const useCase = new ChangeActorStatusUseCase(
      input.executionContext,
      input.actorRepository
    );

    return this.defaultsInterceptors(useCase.changeStatus.bind(useCase), input, 'actor:change-status', 'actor:change-status');
  }

  private composeFindById(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<string, Actor<ActorsStatus, Extra> | null> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository
    );

    return this.defaultsInterceptors(useCase.findById.bind(useCase), input, 'actor:find', 'actor:find-by-id');
  }

  private composeFindByEmail(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<string, UserActor<ActorsStatus, Extra> | null> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository
    );

    return this.defaultsInterceptors(useCase.findByEmail.bind(useCase), input, 'actor:find', 'actor:find-by-email');
  }

  private composeFindByTelephone(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<string, UserActor<ActorsStatus, Extra> | null> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository
    );

    return this.defaultsInterceptors(useCase.findByTelephone.bind(useCase), input, 'actor:find', 'actor:find-by-telephone');
  }

  private composeFindByName(input: ActorCompositionInput<ActorsStatus, Extra>): Handler<string, Actor<ActorsStatus, Extra>[]> {
    const useCase = new FindActorUseCase(
      input.executionContext,
      input.actorRepository
    );

    return this.defaultsInterceptors(useCase.findByName.bind(useCase), input, 'actor:find', 'actor:find-by-name');
  }

  private defaultsInterceptors<Input, Output>(
    handler: Handler<Input, Output>,
    input: ActorCompositionInput<ActorsStatus, Extra>,
    permission: PermissionKey,
    action: string,
  ): Handler<Input, Output> {
    const errorIntercept = new ErrorIntercept<Input, Output>(this.logger);
    const auditIntercept = new AuditIntercept<Input, Output>({
      action,
      executionContext: input.executionContext,
      auditRepository: input.auditRepository,
      permissionContext: input.permissionContext,
    });

    if (input.permissionContext) {
      return pipe(
        handler,
        errorIntercept,
        auditIntercept,
        new PermissionIntercept<Input, Output>(permission, input.permissionContext),
      );
    }

    return pipe(
      handler,
      errorIntercept,
      auditIntercept,
    )
  }
}
