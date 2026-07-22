import type { Membership } from '../../../core/entities/membership/membership.ts';
import type { LoggerPort } from '../../../core/ports/logger.port.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { composeMembershipChangeStatus } from './membership.change.status.composition.ts';
import type { MembershipCompositionInput } from './membership.composition.input.ts';
import { composeMembershipCreate } from './membership.create.composition.ts';
import {
  composeMembershipFindByActorId,
  composeMembershipFindById,
  composeMembershipFindByOrganizationId,
} from './membership.find.composition.ts';
import { composeMembershipUpdate } from './membership.update.composition.ts';

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
    this.create = composeMembershipCreate(input);
    this.update = composeMembershipUpdate(input);
    this.changeStatus = composeMembershipChangeStatus(input);
    this.findById = composeMembershipFindById(input);
    this.findByOrganizationId = composeMembershipFindByOrganizationId(input);
    this.findByActorId = composeMembershipFindByActorId(input);
  }
}
