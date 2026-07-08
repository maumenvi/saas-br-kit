import type { User } from "../../../domain/index.ts";

export type AuthenticatedProfile = Readonly<{
  user: User;
}>;
