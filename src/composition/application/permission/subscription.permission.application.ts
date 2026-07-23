import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import { ChangeSubscriptionStatusUseCase } from '../../../core/entities/subscription/application/subscription.change.status.ts';
import { CreateSubscriptionUseCase } from '../../../core/entities/subscription/application/subscription.create.ts';
import { FindSubscriptionByIdUseCase } from '../../../core/entities/subscription/application/subscription.find.ts';
import { RenewSubscriptionUseCase, type RenewSubscriptionInput } from '../../../core/entities/subscription/application/subscription.renew.ts';
import { UpdateSubscriptionUseCase } from '../../../core/entities/subscription/application/subscription.update.ts';
import type { Subscription } from '../../../core/entities/subscription/subscription.ts';
import type { CreateSubscriptionInput } from '../../../core/entities/subscription/application/subscription.input.ts';
import type { SubscriptionRepositoryPort } from '../../../core/entities/subscription/subscription.repositories.ts';
import type { CustomerRepositoryPort } from '../../../core/entities/customer/customer.repositories.ts';
import type { PlanRepositoryPort } from '../../../core/entities/plan/plan.repositories.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../../modules/shared/default.interceptors.ts';
import { assertOrganizationScope } from '../../../core/access-control/organization.scope.ts';

export type SubscriptionRelationQuery = Readonly<{
  organizationId: string;
  relationId: string;
}>;
export type SubscriptionIdQuery = Readonly<{
  organizationId: string;
  id: string;
}>;

export type SubscriptionPermissionApplication<Status, Extra = unknown> =
  Readonly<{
    create: Handler<CreateSubscriptionInput<Status, Extra>, void>;
    update: Handler<Subscription<Status, Extra>, void>;
    changeStatus: Handler<Subscription<Status, Extra>, void>;
    renew: Handler<RenewSubscriptionInput, void>;
    findById: Handler<SubscriptionIdQuery, Subscription<Status, Extra> | null>;
    findByCustomerId:
      Handler<SubscriptionRelationQuery, Subscription<Status, Extra>[]>;
    findByPlanId:
      Handler<SubscriptionRelationQuery, Subscription<Status, Extra>[]>;
    findByOrganizationId:
      Handler<string, Subscription<Status, Extra>[]>;
  }>;

export function createSubscriptionPermissionApplication<
  Status,
  Extra = unknown,
>(
  input: {
    executionContext: ExecutionContext;
    auditRepository: AuditRepositoryPort;
    subscriptionRepository: SubscriptionRepositoryPort<Status, Extra>;
    customerRepository: CustomerRepositoryPort<unknown, unknown>;
    planRepository: PlanRepositoryPort<unknown, unknown>;
    permissionContext: PermissionContext;
  },
): SubscriptionPermissionApplication<Status, Extra> {
  const create = new CreateSubscriptionUseCase(
    input.executionContext,
    input.subscriptionRepository,
    input.customerRepository,
    input.planRepository,
  );
  const update = new UpdateSubscriptionUseCase(
    input.executionContext,
    input.subscriptionRepository,
    input.customerRepository,
    input.planRepository,
  );
  const changeStatus = new ChangeSubscriptionStatusUseCase(
    input.executionContext,
    input.subscriptionRepository,
  );
  const renew = new RenewSubscriptionUseCase(
    input.executionContext,
    input.subscriptionRepository,
  );
  const find = new FindSubscriptionByIdUseCase(
    input.executionContext,
    input.subscriptionRepository,
  );
  const wrap = <I, O>(
    handler: Handler<I, O>,
    action: string,
    permission: 'subscription:create' | 'subscription:update' |
      'subscription:change-status' | 'subscription:find',
    organizationId: (request: I) => string,
  ) => withDefaultInterceptors<I, O>(
    async (request: I): Promise<O> => {
      assertOrganizationScope(input.permissionContext, organizationId(request));
      return await handler(request);
    },
    { ...input, action, permission },
  );

  return Object.freeze({
    create: wrap(
      create.execute.bind(create),
      'subscription:create',
      'subscription:create',
      value => value.organizationId,
    ),
    update: wrap(
      update.update.bind(update),
      'subscription:update',
      'subscription:update',
      value => value.organizationId,
    ),
    changeStatus: wrap(
      changeStatus.changeStatus.bind(changeStatus),
      'subscription:change-status',
      'subscription:change-status',
      value => value.organizationId,
    ),
    renew: wrap(
      renew.execute.bind(renew),
      'subscription:renew',
      'subscription:update',
      value => value.organizationId,
    ),
    findById: wrap(
      (query: SubscriptionIdQuery) => find.findById(query.organizationId, query.id),
      'subscription:find-by-id',
      'subscription:find',
      (query: SubscriptionIdQuery) => query.organizationId,
    ),
    findByCustomerId: wrap(
      (query: SubscriptionRelationQuery) => find.findByCustomerId(
        query.organizationId,
        query.relationId,
      ),
      'subscription:find-by-customer',
      'subscription:find',
      (query: SubscriptionRelationQuery) => query.organizationId,
    ),
    findByPlanId: wrap(
      (query: SubscriptionRelationQuery) =>
        find.findByPlanId(query.organizationId, query.relationId),
      'subscription:find-by-plan',
      'subscription:find',
      (query: SubscriptionRelationQuery) => query.organizationId,
    ),
    findByOrganizationId: wrap(
      find.findByOrganizationId.bind(find),
      'subscription:find-by-organization',
      'subscription:find',
      (organizationId: string) => organizationId,
    ),
  });
}
