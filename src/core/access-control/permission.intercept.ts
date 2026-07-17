import type { Handler, Interceptor } from '../shared/application/handler.ts';
import type { PermissionKey } from './permission.catalog.ts';

export class PermissionIntercept<Input, Output> implements Interceptor<unknown, Output> {
  private readonly permission: PermissionKey;

  constructor(permission: PermissionKey) {
    this.permission = permission;
  }

  async intercept(request: unknown, next: Handler<unknown, Output>): Promise<Output> {
    return next(request);
  }
}
