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
import type { RegistrationApplication } from './public/registration.application.ts';
import type { TenantApplication } from './public/tenant.application.ts';
import type { VerificationApplication } from './public/verification.application.ts';
import type { AppointmentApplication } from './public/appointment.application.ts';

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
  readonly registration: RegistrationApplication<
    Statuses['actors'],
    Statuses['organizations'],
    Statuses['memberships'],
    Extras['actors'],
    Extras['organizations'],
    Extras['memberships']
  >;
  readonly tenant: TenantApplication<Statuses['organizations']>;
  readonly verification: VerificationApplication<
    Statuses['actors'],
    Statuses['memberships'],
    Extras['actors'],
    Extras['memberships']
  >;
  readonly appointment: AppointmentApplication;

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
      mfa: Object.freeze({ ...input.mfa }),
      verification: Object.freeze({
        ...input.verification,
        ttlMs: Object.freeze({ ...input.verification.ttlMs }),
      }),
      policy: Object.freeze({
        actor: Object.freeze({ ...input.policy.actor }),
        organization: Object.freeze({ ...input.policy.organization }),
        subscription: Object.freeze({ ...input.policy.subscription }),
        appointment: Object.freeze({ ...input.policy.appointment }),
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
      mfa: this.#input.mfa,
      verification: this.#input.verification,
      policy: this.#input.policy,
      repositories: this.#input.repositories,
    });
    this.auth = publicApplication.auth;
    this.registration = publicApplication.registration;
    this.tenant = publicApplication.tenant;
    this.verification = publicApplication.verification;
    this.appointment = publicApplication.appointment;
  }

  withPermission(
    membership: Membership<Statuses['memberships'], Extras['memberships']>,
  ): PermissionApplication<Statuses, Extras> {
    return createPermissionApplication({
      executionContext: this.#context.executionContext,
      membership,
      mfa: this.#input.mfa,
      verification: this.#input.verification,
      policy: this.#input.policy,
      repositories: this.#input.repositories,
    });
  }
}
