import type { RepositoriesExtra } from '../core/context/app.context.ts';

export const extras: RepositoriesExtra = {
  users: {
    birthDate: Date,
  },
  organizations: {
    inscricaoEstadual: String,
  }
}