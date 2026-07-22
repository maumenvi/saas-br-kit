import {
  PermissionIntercept,
  type PermissionContext,
} from '../../../core/access-control/permission.intercept.ts';
import type { PermissionKey } from '../../../core/access-control/permission.catalog.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import {
  AuditIntercept,
  type AuditIdentityResolver,
} from '../../../core/entities/audit/audit.intercept.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import { ErrorIntercept } from '../../../core/shared/application/error.intercept.ts';
import type {
  Handler,
  Interceptor,
} from '../../../core/shared/application/handler.ts';
import { IdempotencyIntercept } from '../../../core/shared/application/idempotency.intercept.ts';
import { pipe } from '../../pipe/pipe.ts';

export type DefaultInterceptorsInput<Input, Output> = {
  action: string;
  executionContext: ExecutionContext;
  auditRepository: AuditRepositoryPort;
  permission?: PermissionKey;
  permissionContext?: PermissionContext;
  identityResolver?: AuditIdentityResolver<Input, Output>;
  idempotent?: boolean;
};

export function withDefaultInterceptors<Input, Output>(
  handler: Handler<Input, Output>,
  input: DefaultInterceptorsInput<Input, Output>,
): Handler<Input, Output> {
  const interceptors: Interceptor<Input, Output>[] = [
    new ErrorIntercept<Input, Output>(input.executionContext.loggerProvider),
    new AuditIntercept<Input, Output>({
      action: input.action,
      executionContext: input.executionContext,
      auditRepository: input.auditRepository,
      permissionContext: input.permissionContext,
      identityResolver: input.identityResolver,
    }),
  ];

  if (input.permission && input.permissionContext) {
    interceptors.push(
      new PermissionIntercept<Input, Output>(
        input.permission,
        input.permissionContext,
      ),
    );
  }

  if (input.executionContext.idempotencyProvider && input.idempotent !== false) {
    interceptors.push(
      new IdempotencyIntercept<Input, Output>(
        input.action,
        input.executionContext.idempotencyProvider,
        input.permissionContext,
      ),
    );
  }

  return pipe(handler, ...interceptors);
}
