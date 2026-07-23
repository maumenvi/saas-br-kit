import type { EntityInput } from '../../shared/input/entity.input.ts';

export type PlanService = Readonly<{
  quantity: number;
  serviceId: string;
}>;

export type Plan<Status, Extra = unknown> = EntityInput<Status> & {
  organizationId: string;
  name: string;
  price: number;
  services: PlanService[];
} & Extra;
