import type { RepositoriesExtra } from '../core/context/app.context.ts';

export const extras: RepositoriesExtra = {
  actors: {
    birthDate: Date,
  },
  organizations: {
    inscricaoEstadual: String,
  },
  memberships: {
    invitedBy: String,
  },
  services: {},
  customers: {},
  plans: {},
  subscriptions: {},
  appointments: {},
}
