import type { TenantComposition } from '../modules/tenant/tenant.composition.ts';

export type TenantApplication<OrganizationStatus> = Pick<
  TenantComposition<OrganizationStatus>,
  'resolve'
>;
