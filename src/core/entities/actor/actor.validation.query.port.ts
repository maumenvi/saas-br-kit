import type { ActorType } from './actor.ts';

export interface ActorValidationQueryPort {
  findById(id: string): Promise<{
    id: string;
    type: ActorType;
    enabled: boolean;
    emailVerified?: boolean;
  } | null>;
}
