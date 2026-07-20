import type { ExecutionContext } from '../../core/context/execution.context.ts';
import type { ActorValidationQueryPort } from '../../core/entities/actor/actor.validation.query.port.ts';
import { ChangeMembershipStatusUseCase } from '../../core/entities/membership/application/membership.changeStatus.ts';
import { CreateMembershipUseCase } from '../../core/entities/membership/application/membership.create.ts';
import { FindMembershipByIdUseCase } from '../../core/entities/membership/application/membership.find.ts';
import { UpdateMembershipUseCase } from '../../core/entities/membership/application/membership.update.ts';
import type { MembershipRepositoryPort } from '../../core/entities/membership/membership.repositories.ts';
import type { Membership } from '../../core/entities/membership/membership.ts';
import type { OrganizationValidationQueryPort } from '../../core/entities/organization/organization.validation.query.port.ts';
import type { LoggerPort } from '../../core/ports/logger.port.ts';
import { ErrorIntercept } from '../../core/shared/application/error.intercept.ts';
import type { Handler } from '../../core/shared/application/handler.ts';
import { pipe } from '../pipe/pipe.ts';

export type MembershipCompositionInput<MembershipsStatus, Extra = unknown> = {
  executionContext: ExecutionContext;
  membershipRepository: MembershipRepositoryPort<MembershipsStatus, Extra>;
  actorValidationQuery: ActorValidationQueryPort;
  organizationValidationQuery: OrganizationValidationQueryPort;
}

export class MembershipComposition<MembershipsStatus, Extra = unknown> {
  readonly create: Handler<Membership<MembershipsStatus, Extra>, void>;
  readonly update: Handler<Membership<MembershipsStatus, Extra>, void>;
  readonly changeStatus: Handler<Membership<MembershipsStatus, Extra>, void>;
  readonly findById: Handler<string, Membership<MembershipsStatus, Extra> | null>;
  readonly findByOrganizationId: Handler<string, Membership<MembershipsStatus, Extra>[]>;
  readonly findByActorId: Handler<string, Membership<MembershipsStatus, Extra>[]>;
  readonly logger: LoggerPort;

  constructor(input: MembershipCompositionInput<MembershipsStatus, Extra>) {
    this.logger = input.executionContext.loggerProvider;
    this.create = this.composeCreate(input);
    this.update = this.composeUpdate(input);
    this.changeStatus = this.composeChangeStatus(input);
    this.findById = this.composeFindById(input);
    this.findByOrganizationId = this.composeFindByOrganizationId(input);
    this.findByActorId = this.composeFindByActorId(input);
  }

  private composeCreate(input: MembershipCompositionInput<MembershipsStatus, Extra>): Handler<Membership<MembershipsStatus, Extra>, void> {
    const useCase = new CreateMembershipUseCase(
      input.executionContext,
      input.membershipRepository,
      input.actorValidationQuery,
      input.organizationValidationQuery
    );

    return this.defaultsInterceptors(useCase.execute.bind(useCase));
  }

  private composeUpdate(input: MembershipCompositionInput<MembershipsStatus, Extra>): Handler<Membership<MembershipsStatus, Extra>, void> {
    const useCase = new UpdateMembershipUseCase(
      input.executionContext,
      input.membershipRepository
    );

    return this.defaultsInterceptors(useCase.update.bind(useCase));
  }

  private composeChangeStatus(input: MembershipCompositionInput<MembershipsStatus, Extra>): Handler<Membership<MembershipsStatus, Extra>, void> {
    const useCase = new ChangeMembershipStatusUseCase(
      input.executionContext,
      input.membershipRepository
    );

    return this.defaultsInterceptors(useCase.changeStatus.bind(useCase));
  }

  private composeFindById(input: MembershipCompositionInput<MembershipsStatus, Extra>): Handler<string, Membership<MembershipsStatus, Extra> | null> {
    const useCase = new FindMembershipByIdUseCase(
      input.executionContext,
      input.membershipRepository
    );

    return this.defaultsInterceptors(useCase.findById.bind(useCase));
  }

  private composeFindByOrganizationId(input: MembershipCompositionInput<MembershipsStatus, Extra>): Handler<string, Membership<MembershipsStatus, Extra>[]> {
    const useCase = new FindMembershipByIdUseCase(
      input.executionContext,
      input.membershipRepository
    );

    return this.defaultsInterceptors(useCase.findByOrganizationId.bind(useCase));
  }

  private composeFindByActorId(input: MembershipCompositionInput<MembershipsStatus, Extra>): Handler<string, Membership<MembershipsStatus, Extra>[]> {
    const useCase = new FindMembershipByIdUseCase(
      input.executionContext,
      input.membershipRepository
    );

    return this.defaultsInterceptors(useCase.findByActorId.bind(useCase));
  }

  private defaultsInterceptors<Input, Output>(handler: Handler<Input, Output>): Handler<Input, Output> {
    return pipe(
      handler,
      new ErrorIntercept<Input, Output>(this.logger)
    );
  }
}
