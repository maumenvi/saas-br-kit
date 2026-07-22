import type {
  AppContextInput,
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../core/context/app.context.ts';
import type { AuthType } from '../../core/entities/auth/application/auth.authorize.ts';

export type ApplicationInput<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = AppContextInput<
  Statuses,
  Extras,
  TokenOutput,
  AuthenticationType,
  CustomAuth
>;
