import type { Service } from '../service.ts';

export type CreateServiceInput<Status, Extra = unknown> = Omit<
  Service<Status, Extra>,
  'includedServiceIds'
> & {
  includedServiceIds?: string[];
};
