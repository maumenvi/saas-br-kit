import {
  AppContext,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from '../../core/context/app.context.ts';
import type { AuthType } from '../../core/entities/auth/application/auth.authorize.ts';
import type { Membership } from '../../core/entities/membership/membership.ts';
import type { ApplicationInput } from './application.input.ts';
import {
  createPermissionApplication,
  type PermissionApplication,
} from './permission/permission.application.ts';
import type { AuthApplication } from './public/auth.application.ts';
import { createPublicApplication } from './public/public.application.ts';
import type { TenantApplication } from './public/tenant.application.ts';

export class Application<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> {
  readonly #context: AppContext<
    Statuses,
    Extras,
    TokenOutput,
    AuthenticationType,
    CustomAuth
  >;
  readonly #input: ApplicationInput<
    TokenOutput,
    Statuses,
    Extras,
    AuthenticationType,
    CustomAuth
  >;
  readonly auth: AuthApplication<
    TokenOutput,
    AuthenticationType,
    CustomAuth,
    Statuses['memberships'],
    Extras['memberships']
  >;
  readonly tenant: TenantApplication<Statuses['organizations']>;

  constructor(
    input: ApplicationInput<
      TokenOutput,
      Statuses,
      Extras,
      AuthenticationType,
      CustomAuth
    >,
  ) {
    this.#input = Object.freeze({
      ...input,
      repositories: Object.freeze({ ...input.repositories }),
      policy: Object.freeze({
        actor: Object.freeze({ ...input.policy.actor }),
        organization: Object.freeze({ ...input.policy.organization }),
      }),
    });

    this.#context = new AppContext<
      Statuses,
      Extras,
      TokenOutput,
      AuthenticationType,
      CustomAuth
    >(input);

    const publicApplication = createPublicApplication({
      executionContext: this.#context.executionContext,
      authentication: this.#input.authentication,
      policy: this.#input.policy,
      repositories: this.#input.repositories,
    });
    this.auth = publicApplication.auth;
    this.tenant = publicApplication.tenant;
  }

  withPermission(
    membership: Membership<Statuses['memberships'], Extras['memberships']>,
  ): PermissionApplication<Statuses, Extras> {
    return createPermissionApplication({
      executionContext: this.#context.executionContext,
      membership,
      policy: this.#input.policy,
      repositories: this.#input.repositories,
    });
  }
}
