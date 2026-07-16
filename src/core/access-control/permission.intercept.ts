import type { AuthorizationQueryPort } from '../ports/authorization.query.port.ts';
import type { Handler, Interceptor } from '../shared/application/handler.ts';
import type { AuthenticatedInput } from '../shared/input/authenticated.input.ts';
import type { PermissionKey } from './permission.catalog.ts';

export class PermissionIntercept<Input, Output> implements Interceptor<AuthenticatedInput<Input>, Output> {
  constructor(
    private readonly authorizationQuery: AuthorizationQueryPort,
    private readonly permission: PermissionKey
  ) { }

  async intercept(request: AuthenticatedInput<Input>, next: Handler<AuthenticatedInput<Input>, Output>): Promise<Output> {
    await this.authorizationQuery.authorize({
      userId: request.auth.userId,
      organizationId: request.auth.organizationId,
      permission: this.permission
    });

    return next(request);
  }
}