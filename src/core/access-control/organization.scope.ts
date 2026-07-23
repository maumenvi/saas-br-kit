import type { PermissionContext } from './permission.intercept.ts';
import { DomainError } from '../shared/domain/domain.error.ts';

const ORGANIZATION_SCOPE_TARGET =
  'src/core/access-control/organization.scope.ts';

export const ORGANIZATION_SCOPE_ERROR_CODE = {
  DENIED: 'ACCESS_CONTROL_ORGANIZATION_SCOPE_DENIED',
} as const;

export function assertOrganizationScope(
  context: PermissionContext,
  organizationId: string,
): void {
  if (organizationId === context.organizationId) return;
  throw new DomainError({
    code: ORGANIZATION_SCOPE_ERROR_CODE.DENIED,
    target: ORGANIZATION_SCOPE_TARGET,
    message: `Membership ${context.id} cannot access organization ${organizationId}.`,
    details: {
      membershipId: context.id,
      expectedOrganizationId: context.organizationId,
      receivedOrganizationId: organizationId,
    },
  });
}
