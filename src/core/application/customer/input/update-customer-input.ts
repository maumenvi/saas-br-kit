import type { SafeMetadata } from "../../../domain/index.ts";

export type UpdateCustomerInput = Readonly<{
  organizationId: string;
  customerId: string;
  name?: string;
  email?: string | null;
  document?: string | null;
  metadata?: SafeMetadata | null;
}>;
