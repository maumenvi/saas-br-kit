import {
  AppContext,
  type RepositoriesExtra,
  type RepositoriesStatus,
} from '../../core/context/app.context.ts';
import type { AuthType } from '../../core/entities/auth/application/auth.authorize.ts';
import type { Membership } from '../../core/entities/membership/membership.ts';
import { AuthComposition } from '../modules/auth/auth.composition.ts';
import { TenantComposition } from '../modules/tenant/tenant.composition.ts';
import type { ApplicationInput } from './application.input.ts';
import {
  createPermissionApplication,
  type PermissionApplication,
} from './permission/permission.application.ts';
import type { TenantApplication } from './tenant.application.ts';

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
  readonly auth: AuthComposition<
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

    this.auth = new AuthComposition({
      executionContext: this.#context.executionContext,
      auditRepository: this.#input.repositories.audits,
      actorRepositoryPort: this.#input.repositories.actors,
      membershipRepository: this.#input.repositories.memberships,
      authentication: this.#input.authentication,
    });

    const tenant = new TenantComposition({
      executionContext: this.#context.executionContext,
      auditRepository: this.#input.repositories.audits,
      organizationRepository: this.#input.repositories.organizations,
      policy: {
        organizationStatusPolicy:
          this.#input.policy.organization.organizationStatusPolicy,
        organizationSlugPolicy:
          this.#input.policy.organization.organizationSlugPolicy,
      },
    });
    this.tenant = Object.freeze({ resolve: tenant.resolve });
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
