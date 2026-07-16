import type { PermissionKey } from '../access-control/permission.catalog.ts';

export interface AuthorizationQueryPort {
  authorize(
    input: {
      userId: string;
      organizationId?: string;
      permission: PermissionKey
    }
  ): Promise<void>;
}