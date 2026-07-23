import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import { ChangePlanStatusUseCase } from '../../../core/entities/plan/application/plan.change.status.ts';
import { CreatePlanUseCase } from '../../../core/entities/plan/application/plan.create.ts';
import { FindPlanByIdUseCase } from '../../../core/entities/plan/application/plan.find.ts';
import { UpdatePlanUseCase } from '../../../core/entities/plan/application/plan.update.ts';
import type { Plan } from '../../../core/entities/plan/plan.ts';
import type { PlanRepositoryPort } from '../../../core/entities/plan/plan.repositories.ts';
import type { ServiceRepositoryPort } from '../../../core/entities/service/service.repositories.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../../modules/shared/default.interceptors.ts';
import { assertOrganizationScope } from '../../../core/access-control/organization.scope.ts';

export type PlanNameQuery = Readonly<{ organizationId: string; name: string }>;
export type PlanIdQuery = Readonly<{ organizationId: string; id: string }>;
export type PlanServicesQuery = Readonly<{
  organizationId: string;
  serviceIds: string[];
}>;

export type PlanPermissionApplication<Status, Extra = unknown> = Readonly<{
  create: Handler<Plan<Status, Extra>, void>;
  update: Handler<Plan<Status, Extra>, void>;
  changeStatus: Handler<Plan<Status, Extra>, void>;
  findById: Handler<PlanIdQuery, Plan<Status, Extra> | null>;
  findByName: Handler<PlanNameQuery, Plan<Status, Extra>[]>;
  findByOrganizationId: Handler<string, Plan<Status, Extra>[]>;
  findByOneOrMoreServices: Handler<PlanServicesQuery, Plan<Status, Extra>[]>;
}>;

export function createPlanPermissionApplication<Status, Extra = unknown>(
  input: {
    executionContext: ExecutionContext;
    auditRepository: AuditRepositoryPort;
    planRepository: PlanRepositoryPort<Status, Extra>;
    serviceRepository: ServiceRepositoryPort<unknown, unknown>;
    permissionContext: PermissionContext;
  },
): PlanPermissionApplication<Status, Extra> {
  const create = new CreatePlanUseCase(
    input.executionContext,
    input.planRepository,
    input.serviceRepository,
  );
  const update = new UpdatePlanUseCase(
    input.executionContext,
    input.planRepository,
    input.serviceRepository,
  );
  const changeStatus = new ChangePlanStatusUseCase(
    input.executionContext,
    input.planRepository,
  );
  const find = new FindPlanByIdUseCase(
    input.executionContext,
    input.planRepository,
  );
  const wrap = <I, O>(
    handler: Handler<I, O>,
    action: string,
    permission: 'plan:create' | 'plan:update' |
      'plan:change-status' | 'plan:find',
    organizationId: (request: I) => string,
  ) => withDefaultInterceptors<I, O>(
    async (request: I): Promise<O> => {
      assertOrganizationScope(input.permissionContext, organizationId(request));
      return await handler(request);
    },
    { ...input, action, permission },
  );

  return Object.freeze({
    create: wrap(create.execute.bind(create), 'plan:create', 'plan:create', value => value.organizationId),
    update: wrap(update.update.bind(update), 'plan:update', 'plan:update', value => value.organizationId),
    changeStatus: wrap(
      changeStatus.changeStatus.bind(changeStatus),
      'plan:change-status',
      'plan:change-status',
      value => value.organizationId,
    ),
    findById: wrap(
      (query: PlanIdQuery) => find.findById(query.organizationId, query.id),
      'plan:find-by-id',
      'plan:find',
      (query: PlanIdQuery) => query.organizationId,
    ),
    findByName: wrap(
      (query: PlanNameQuery) => find.findByName(query.organizationId, query.name),
      'plan:find-by-name',
      'plan:find',
      (query: PlanNameQuery) => query.organizationId,
    ),
    findByOrganizationId: wrap(
      find.findByOrganizationId.bind(find),
      'plan:find-by-organization',
      'plan:find',
      (organizationId: string) => organizationId,
    ),
    findByOneOrMoreServices: wrap(
      (query: PlanServicesQuery) => find.findByOneOrMoreServices(
        query.organizationId,
        query.serviceIds,
      ),
      'plan:find-by-services',
      'plan:find',
      (query: PlanServicesQuery) => query.organizationId,
    ),
  });
}
