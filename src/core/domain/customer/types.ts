import type { OrganizationId } from "../index.ts";
import type { SafeMetadata } from "../metadata/index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { CustomerStatus } from "./status.ts";

export type CustomerProps = Readonly<{
  id: string;
  organizationId: OrganizationId;
  name: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  email?: string;
  document?: string;
  metadata?: SafeMetadata;
}>;

export type CreateCustomerEntityInput = Readonly<{
  id: string;
  organizationId: OrganizationId;
  name: string;
  status?: CustomerStatus;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  email?: string;
  document?: string;
  metadata?: SafeMetadata;
}>;
