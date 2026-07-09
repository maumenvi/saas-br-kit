import type { UserStatus } from "../../../domain/index.ts";

export type UpdateActorInput = Readonly<{
  actorId: string;
  displayName?: string | null;
  status?: UserStatus;
}>;
