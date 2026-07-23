import type { EntityInput } from '../../shared/input/entity.input.ts';

export type UsedService = Readonly<{
  serviceId: string;
  quantity: number;
  used: number;
}>;

export type Subscription<Status, Extra = unknown> = EntityInput<Status> & {
  organizationId: string;
  customerId: string;
  planId: string;
  price: number;
  usedServices: UsedService[];
  recurrenceDays: number;
  lastPayment: Date;
  nextPayment: Date;
  paymentProvider: string;
} & Extra;
