import type { UserId } from "../index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { UserStatus } from "./status.ts";

export type UserProps = Readonly<{
  id: UserId;
  email: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
}>;

export type CreateUserEntityInput = Readonly<{
  id: UserId;
  email: string;
  status?: UserStatus;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
  displayName?: string;
}>;
