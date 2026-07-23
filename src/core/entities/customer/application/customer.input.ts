import type { Customer } from '../customer.ts';

export type CustomerInput<Status, Extra = unknown> =
  Customer<Status, Extra>;
