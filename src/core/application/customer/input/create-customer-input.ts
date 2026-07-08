import type { SafeMetadata } from "../../../domain/index.ts";

export type CreateCustomerInput = Readonly<{
  organizationId: string;
  name: string;
  email?: string;
  document?: string;
  metadata?: SafeMetadata;
}>;
