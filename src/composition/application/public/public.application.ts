import type {
  RepositoriesExtra,
  RepositoriesStatus,
} from '../../../core/context/app.context.ts';
import type { AuthType } from '../../../core/entities/auth/application/auth.authorize.ts';
import {
  createAuthApplication,
  type AuthApplication,
} from './auth.application.ts';
import type { PublicApplicationInput } from './public.application.input.ts';
import {
  createRegistrationApplication,
  type RegistrationApplication,
} from './registration.application.ts';
import {
  createTenantApplication,
  type TenantApplication,
} from './tenant.application.ts';

export type PublicApplication<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra = RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
> = Readonly<{
  auth: AuthApplication<
    TokenOutput,
    AuthenticationType,
    CustomAuth,
    Statuses['memberships'],
    Extras['memberships']
  >;
  registration: RegistrationApplication<
    Statuses['actors'],
    Statuses['organizations'],
    Statuses['memberships'],
    Extras['actors'],
    Extras['organizations'],
    Extras['memberships']
  >;
  tenant: TenantApplication<Statuses['organizations']>;
}>;

export function createPublicApplication<
  TokenOutput,
  Statuses extends RepositoriesStatus,
  Extras extends RepositoriesExtra,
  AuthenticationType extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
>(
  input: PublicApplicationInput<
    TokenOutput,
    Statuses,
    Extras,
    AuthenticationType,
    CustomAuth
  >,
): PublicApplication<
  TokenOutput,
  Statuses,
  Extras,
  AuthenticationType,
  CustomAuth
> {
  const auth = createAuthApplication<
    TokenOutput,
    AuthenticationType,
    CustomAuth,
    Statuses['memberships'],
    Extras['memberships']
  >({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    actorRepositoryPort: input.repositories.actors,
    membershipRepository: input.repositories.memberships,
    authentication: input.authentication,
  });

  const tenant = createTenantApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    organizationRepository: input.repositories.organizations,
    policy: {
      organizationStatusPolicy:
        input.policy.organization.organizationStatusPolicy,
      organizationSlugPolicy:
        input.policy.organization.organizationSlugPolicy,
    },
  });

  const registration = createRegistrationApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    actorRepository: input.repositories.actors,
    organizationRepository: input.repositories.organizations,
    membershipRepository: input.repositories.memberships,
    policy: {
      actorStatusPolicy: input.policy.actor.actorStatusPolicy,
      organizationStatusPolicy:
        input.policy.organization.organizationStatusPolicy,
      organizationSlugPolicy:
        input.policy.organization.organizationSlugPolicy,
    },
  });

  return Object.freeze({ auth, registration, tenant });
}
