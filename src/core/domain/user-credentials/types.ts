import type { UserId } from "../index.ts";
import type { TimestampInput } from "../validation/index.ts";
import type { UserCredentialStatus } from "./status.ts";

export type UserCredentialsProps = Readonly<{
  userId: UserId;
  email: string;
  passwordHash: string;
  status: UserCredentialStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateUserCredentialsInput = Readonly<{
  userId: UserId;
  email: string;
  passwordHash: string;
  status?: UserCredentialStatus;
  createdAt: TimestampInput;
  updatedAt?: TimestampInput;
}>;
