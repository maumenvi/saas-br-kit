import type { Handler, Interceptor } from '../shared/application/handler.ts';
import { DomainError } from '../shared/domain/domain.error.ts';
import type { PermissionKey } from './permission.catalog.ts';

const PERMISSION_TARGET = 'src/core/access-control/permission.intercept.ts';

export const ACCESS_CONTROL_ERROR_CODE = {
  PERMISSION_DENIED: 'ACCESS_CONTROL_PERMISSION_DENIED',
} as const;

export const PermissionErrors = {
  denied: (permission: PermissionKey, membershipId: string) => new DomainError({
    code: ACCESS_CONTROL_ERROR_CODE.PERMISSION_DENIED,
    target: PERMISSION_TARGET,
    message: `Membership ${membershipId} does not have permission ${permission}.`,
    details: { permission, membershipId },
  }),
};

export type PermissionDecision = Readonly<{
  membershipId: string;
  permission: PermissionKey;
  effect: 'allow' | 'deny';
}>;

export type PermissionContext = Readonly<{
  id: string;
  actorId: string;
  organizationId: string;
  permissions: readonly PermissionDecision[];
}>;

export class PermissionIntercept<Input, Output> implements Interceptor<Input, Output> {
  private readonly permission: PermissionKey;
  private readonly context: PermissionContext;

  constructor(permission: PermissionKey, context: PermissionContext) {
    this.permission = permission;
    this.context = Object.freeze({
      id: context.id,
      actorId: context.actorId,
      organizationId: context.organizationId,
      permissions: Object.freeze(
        context.permissions.map((decision) => Object.freeze({ ...decision })),
      ),
    });
  }

  async intercept(request: Input, next: Handler<Input, Output>): Promise<Output> {
    const permissions = this.context.permissions.filter(
      ({ membershipId, permission }) =>
        membershipId === this.context.id && permission === this.permission,
    );
    const denied = permissions.some(({ effect }) => effect === 'deny');
    const allowed = permissions.some(({ effect }) => effect === 'allow');

    if (denied || !allowed) {
      throw PermissionErrors.denied(this.permission, this.context.id);
    }

    return next(request);
  }
}
