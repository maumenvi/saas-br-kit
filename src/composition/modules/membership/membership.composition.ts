import { ChangeMembershipStatusUseCase } from '../../../core/entities/membership/application/membership.changeStatus.ts';
import { CreateMembershipUseCase } from '../../../core/entities/membership/application/membership.create.ts';
import { FindMembershipByIdUseCase } from '../../../core/entities/membership/application/membership.find.ts';
import { UpdateMembershipUseCase } from '../../../core/entities/membership/application/membership.update.ts';
import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';

export class MembershipComposition<MembershipsStatus, Extra = unknown> {
  readonly create: Handler<Membership<MembershipsStatus, Extra>, void>;
  readonly update: Handler<Membership<MembershipsStatus, Extra>, void>;
  readonly changeStatus: Handler<Membership<MembershipsStatus, Extra>, void>;
  readonly findById: Handler<
    string,
    Membership<MembershipsStatus, Extra> | null
  >;
  readonly findByOrganizationId: Handler<
    string,
    Membership<MembershipsStatus, Extra>[]
  >;
  readonly findByActorId: Handler<
    string,
    Membership<MembershipsStatus, Extra>[]
  >;
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

  private composeCreate(
    input: MembershipCompositionInput<MembershipsStatus, Extra>,
  ): Handler<Membership<MembershipsStatus, Extra>, void> {
    const useCase = new CreateMembershipUseCase(
      input.executionContext,
      input.membershipRepository,
      input.actorValidationQuery,
      input.organizationValidationQuery,
    );

    return withDefaultInterceptors(useCase.execute.bind(useCase), {
      action: 'membership:create',
      permission: 'membership:create',
      ...input,
    });
  }

  private composeUpdate(
    input: MembershipCompositionInput<MembershipsStatus, Extra>,
  ): Handler<Membership<MembershipsStatus, Extra>, void> {
    const useCase = new UpdateMembershipUseCase(
      input.executionContext,
      input.membershipRepository,
      input.permissionContext!,
    );

    return withDefaultInterceptors(useCase.update.bind(useCase), {
      action: 'membership:update',
      permission: 'membership:update',
      ...input,
    });
  }

  private composeChangeStatus(
    input: MembershipCompositionInput<MembershipsStatus, Extra>,
  ): Handler<Membership<MembershipsStatus, Extra>, void> {
    const useCase = new ChangeMembershipStatusUseCase(
      input.executionContext,
      input.membershipRepository,
    );

    return withDefaultInterceptors(useCase.changeStatus.bind(useCase), {
      action: 'membership:change-status',
      permission: 'membership:change-status',
      ...input,
    });
  }

  private composeFindById(
    input: MembershipCompositionInput<MembershipsStatus, Extra>,
  ): Handler<string, Membership<MembershipsStatus, Extra> | null> {
    const useCase = new FindMembershipByIdUseCase(
      input.executionContext,
      input.membershipRepository,
    );

    return withDefaultInterceptors(useCase.findById.bind(useCase), {
      action: 'membership:find-by-id',
      permission: 'membership:find',
      ...input,
    });
  }

  private composeFindByOrganizationId(
    input: MembershipCompositionInput<MembershipsStatus, Extra>,
  ): Handler<string, Membership<MembershipsStatus, Extra>[]> {
    const useCase = new FindMembershipByIdUseCase(
      input.executionContext,
      input.membershipRepository,
    );

    return withDefaultInterceptors(
      useCase.findByOrganizationId.bind(useCase),
      {
        action: 'membership:find-by-organization-id',
        permission: 'membership:find',
        ...input,
      },
    );
  }

  private composeFindByActorId(
    input: MembershipCompositionInput<MembershipsStatus, Extra>,
  ): Handler<string, Membership<MembershipsStatus, Extra>[]> {
    const useCase = new FindMembershipByIdUseCase(
      input.executionContext,
      input.membershipRepository,
    );

    return withDefaultInterceptors(useCase.findByActorId.bind(useCase), {
      action: 'membership:find-by-actor-id',
      permission: 'membership:find',
      ...input,
    });
  }
}
