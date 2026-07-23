import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import { AnonymizeCustomerUseCase, type AnonymizeCustomerInput } from '../../../core/entities/customer/application/customer.anonymize.ts';
import { ChangeCustomerStatusUseCase } from '../../../core/entities/customer/application/customer.change.status.ts';
import { CreateCustomerUseCase } from '../../../core/entities/customer/application/customer.create.ts';
import { FindCustomerByIdUseCase } from '../../../core/entities/customer/application/customer.find.ts';
import { UpdateCustomerUseCase } from '../../../core/entities/customer/application/customer.update.ts';
import type { Customer } from '../../../core/entities/customer/customer.ts';
import type { CustomerRepositoryPort } from '../../../core/entities/customer/customer.repositories.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../../modules/shared/default.interceptors.ts';
import { assertOrganizationScope } from '../../../core/access-control/organization.scope.ts';

export type CustomerValueQuery = Readonly<{
  organizationId: string;
  value: string;
}>;
export type CustomerIdQuery = Readonly<{ organizationId: string; id: string }>;

export type CustomerPermissionApplication<Status, Extra = unknown> = Readonly<{
  create: Handler<Customer<Status, Extra>, void>;
  update: Handler<Customer<Status, Extra>, void>;
  changeStatus: Handler<Customer<Status, Extra>, void>;
  anonymize: Handler<AnonymizeCustomerInput, void>;
  findById: Handler<CustomerIdQuery, Customer<Status, Extra> | null>;
  findByName: Handler<CustomerValueQuery, Customer<Status, Extra>[]>;
  findByEmail: Handler<CustomerValueQuery, Customer<Status, Extra>[]>;
  findByTelephone: Handler<CustomerValueQuery, Customer<Status, Extra>[]>;
  findByOrganizationId: Handler<string, Customer<Status, Extra>[]>;
}>;

export function createCustomerPermissionApplication<Status, Extra = unknown>(
  input: {
    executionContext: ExecutionContext;
    auditRepository: AuditRepositoryPort;
    customerRepository: CustomerRepositoryPort<Status, Extra>;
    permissionContext: PermissionContext;
  },
): CustomerPermissionApplication<Status, Extra> {
  const create = new CreateCustomerUseCase(
    input.executionContext,
    input.customerRepository,
  );
  const update = new UpdateCustomerUseCase(
    input.executionContext,
    input.customerRepository,
  );
  const changeStatus = new ChangeCustomerStatusUseCase(
    input.executionContext,
    input.customerRepository,
  );
  const anonymize = new AnonymizeCustomerUseCase(
    input.executionContext,
    input.customerRepository,
  );
  const find = new FindCustomerByIdUseCase(
    input.executionContext,
    input.customerRepository,
  );
  const wrap = <I, O>(
    handler: Handler<I, O>,
    action: string,
    permission: 'customer:create' | 'customer:update' |
      'customer:change-status' | 'customer:find',
    organizationId: (request: I) => string,
  ) => withDefaultInterceptors<I, O>(
    async (request: I): Promise<O> => {
      assertOrganizationScope(input.permissionContext, organizationId(request));
      return await handler(request);
    },
    { ...input, action, permission },
  );

  return Object.freeze({
    create: wrap(create.execute.bind(create), 'customer:create', 'customer:create', value => value.organizationId),
    update: wrap(update.update.bind(update), 'customer:update', 'customer:update', value => value.organizationId),
    changeStatus: wrap(
      changeStatus.changeStatus.bind(changeStatus),
      'customer:change-status',
      'customer:change-status',
      value => value.organizationId,
    ),
    anonymize: wrap(
      anonymize.execute.bind(anonymize),
      'customer:anonymize',
      'customer:update',
      value => value.organizationId,
    ),
    findById: wrap(
      (query: CustomerIdQuery) => find.findById(query.organizationId, query.id),
      'customer:find-by-id',
      'customer:find',
      (query: CustomerIdQuery) => query.organizationId,
    ),
    findByName: wrap(
      (query: CustomerValueQuery) => find.findByName(query.organizationId, query.value),
      'customer:find-by-name',
      'customer:find',
      (query: CustomerValueQuery) => query.organizationId,
    ),
    findByEmail: wrap(
      (query: CustomerValueQuery) => find.findByEmail(query.organizationId, query.value),
      'customer:find-by-email',
      'customer:find',
      (query: CustomerValueQuery) => query.organizationId,
    ),
    findByTelephone: wrap(
      (query: CustomerValueQuery) => find.findByTelephone(query.organizationId, query.value),
      'customer:find-by-telephone',
      'customer:find',
      (query: CustomerValueQuery) => query.organizationId,
    ),
    findByOrganizationId: wrap(
      find.findByOrganizationId.bind(find),
      'customer:find-by-organization',
      'customer:find',
      (organizationId: string) => organizationId,
    ),
  });
}
