import { TenantComposition } from '../../modules/tenant/tenant.composition.ts';
import type { TenantCompositionInput } from '../../modules/tenant/tenant.composition.input.ts';

export type TenantApplication<OrganizationStatus> = Pick<
  TenantComposition<OrganizationStatus>,
  'resolve'
>;

export function createTenantApplication<OrganizationStatus>(
  input: TenantCompositionInput<OrganizationStatus>,
): TenantApplication<OrganizationStatus> {
  const composition = new TenantComposition(input);

  return Object.freeze({ resolve: composition.resolve });
}
