import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import { ChangeServiceStatusUseCase } from '../../../core/entities/service/application/service.change.status.ts';
import { CreateServiceUseCase } from '../../../core/entities/service/application/service.create.ts';
import { FindServiceByIdUseCase } from '../../../core/entities/service/application/service.find.ts';
import { UpdateServiceUseCase } from '../../../core/entities/service/application/service.update.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { Service } from '../../../core/entities/service/service.ts';
import type { CreateServiceInput } from '../../../core/entities/service/application/service.input.ts';
import type { ServiceRepositoryPort } from '../../../core/entities/service/service.repositories.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../../modules/shared/default.interceptors.ts';
import { assertOrganizationScope } from '../../../core/access-control/organization.scope.ts';

export type ServiceNameQuery = Readonly<{ organizationId: string; name: string }>;
export type ServiceIdQuery = Readonly<{ organizationId: string; id: string }>;
export type ServiceIdsQuery = Readonly<{
  organizationId: string;
  serviceIds: string[];
}>;

export type ServicePermissionApplication<Status, Extra = unknown> = Readonly<{
  create: Handler<CreateServiceInput<Status, Extra>, void>;
  update: Handler<Service<Status, Extra>, void>;
  changeStatus: Handler<Service<Status, Extra>, void>;
  findById: Handler<ServiceIdQuery, Service<Status, Extra> | null>;
  findByName: Handler<ServiceNameQuery, Service<Status, Extra>[]>;
  findByOrganizationId: Handler<string, Service<Status, Extra>[]>;
  findByOneOrMoreIncludedServices:
    Handler<ServiceIdsQuery, Service<Status, Extra>[]>;
}>;

export function createServicePermissionApplication<Status, Extra = unknown>(
  input: {
    executionContext: ExecutionContext;
    auditRepository: AuditRepositoryPort;
    serviceRepository: ServiceRepositoryPort<Status, Extra>;
    permissionContext: PermissionContext;
  },
): ServicePermissionApplication<Status, Extra> {
  const create = new CreateServiceUseCase(
    input.executionContext,
    input.serviceRepository,
  );
  const update = new UpdateServiceUseCase(
    input.executionContext,
    input.serviceRepository,
  );
  const changeStatus = new ChangeServiceStatusUseCase(
    input.executionContext,
    input.serviceRepository,
  );
  const find = new FindServiceByIdUseCase(
    input.executionContext,
    input.serviceRepository,
  );
  const wrap = <I, O>(
    handler: Handler<I, O>,
    action: string,
    permission: 'service:create' | 'service:update' |
      'service:change-status' | 'service:find',
    organizationId: (request: I) => string,
  ) => withDefaultInterceptors<I, O>(
    async (request: I): Promise<O> => {
      assertOrganizationScope(input.permissionContext, organizationId(request));
      return await handler(request);
    },
    { ...input, action, permission },
  );

  return Object.freeze({
    create: wrap(create.execute.bind(create), 'service:create', 'service:create', value => value.organizationId),
    update: wrap(update.update.bind(update), 'service:update', 'service:update', value => value.organizationId),
    changeStatus: wrap(
      changeStatus.changeStatus.bind(changeStatus),
      'service:change-status',
      'service:change-status',
      value => value.organizationId,
    ),
    findById: wrap(
      (query: ServiceIdQuery) => find.findById(query.organizationId, query.id),
      'service:find-by-id',
      'service:find',
      (query: ServiceIdQuery) => query.organizationId,
    ),
    findByName: wrap(
      (query: ServiceNameQuery) => find.findByName(query.organizationId, query.name),
      'service:find-by-name',
      'service:find',
      (query: ServiceNameQuery) => query.organizationId,
    ),
    findByOrganizationId: wrap(
      find.findByOrganizationId.bind(find),
      'service:find-by-organization',
      'service:find',
      (organizationId: string) => organizationId,
    ),
    findByOneOrMoreIncludedServices: wrap(
      (query: ServiceIdsQuery) => find.findByOneOrMoreIncludedServices(
        query.organizationId,
        query.serviceIds,
      ),
      'service:find-by-included-services',
      'service:find',
      (query: ServiceIdsQuery) => query.organizationId,
    ),
  });
}
