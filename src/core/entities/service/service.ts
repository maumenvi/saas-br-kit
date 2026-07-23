import type { EntityInput } from '../../shared/input/entity.input.ts';

export type Service<Status, Extra = unknown> = EntityInput<Status> & {
  organizationId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  includedServiceIds: string[];
} & Extra;
