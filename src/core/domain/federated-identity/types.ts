import type { EntityId, UserId } from "../index.ts";
import type { TimestampInput } from "../validation/index.ts";

export type FederatedIdentityProps = Readonly<{
  id: EntityId;
  userId: UserId;
  providerId: string;
  issuer: string;
  subject: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateFederatedIdentityInput = Readonly<{
  id: EntityId;
  userId: UserId;
  providerId: string;
  issuer: string;
  subject: string;
  email?: string;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
}>;
