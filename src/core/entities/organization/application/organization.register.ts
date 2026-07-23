import { PERMISSION_KEYS } from '../../../access-control/permission.catalog.ts';
import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorRepositoryPort } from '../../actor/actor.repositories.ts';
import type { UserActor } from '../../actor/actor.ts';
import type { ActorStatusPolicyPort } from '../../actor/policies/actor.status.police.ts';
import { AuthErrors } from '../../auth/domain/auth.errors.ts';
import { MembershipErrors } from '../../membership/domain/membership.errors.ts';
import type { MembershipRepositoryPort } from '../../membership/membership.repositories.ts';
import type { MemberPermission, Membership } from '../../membership/membership.ts';
import { OrganizationErrors } from '../domain/organization.errors.ts';
import type { OrganizationRepositoryPort } from '../organization.repositories.ts';
import type { Organization } from '../organization.ts';
import type { OrganizationSlugPolicyPort } from '../policies/organization.slug.policy.ts';
import type { OrganizationStatusPolicyPort } from '../policies/organizations.status.police.ts';
import type {
  OrganizationRegistrationInput,
  OrganizationRegistrationOutput,
} from './organization.registration.input.ts';

export type RegisterOrganizationUseCaseInput<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorStatus, ActorExtra>;
  organizationRepository: OrganizationRepositoryPort<
    OrganizationStatus,
    OrganizationExtra
  >;
  membershipRepository: MembershipRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;
  policy: {
    actorStatusPolicy: ActorStatusPolicyPort<ActorStatus>;
    organizationStatusPolicy: OrganizationStatusPolicyPort<OrganizationStatus>;
    organizationSlugPolicy: OrganizationSlugPolicyPort;
  };
};

export class RegisterOrganizationUseCase<
  ActorStatus,
  OrganizationStatus,
  MembershipStatus,
  ActorExtra = unknown,
  OrganizationExtra = unknown,
  MembershipExtra = unknown,
> {
  private readonly input: RegisterOrganizationUseCaseInput<
    ActorStatus,
    OrganizationStatus,
    MembershipStatus,
    ActorExtra,
    OrganizationExtra,
    MembershipExtra
  >;

  constructor(
    input: RegisterOrganizationUseCaseInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
  ) {
    this.input = input;
  }

  async execute(
    registration: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
  ): Promise<OrganizationRegistrationOutput> {
    const snapshot = this.snapshot(registration);

    this.validate(snapshot);
    const passwordHash = await this.input.executionContext.passwordHashProvider.hash(
      snapshot.user.password,
    );

    return await this.input.executionContext.databaseProvider.run(async () => {
      await this.ensureOrganizationIsUnique(snapshot);

      const existingUser = await this.input.actorRepository.findByEmail(
        snapshot.user.email.value,
      );
      const user = existingUser
        ? await this.authenticateExistingUser(snapshot.user.password, existingUser)
        : this.createUser(snapshot.user, passwordHash);

      if (!existingUser) {
        await this.input.actorRepository.save(user);
      }

      const organization = this.createOrganization(snapshot.organization, user.id);
      const membership = this.createOwnerMembership(
        snapshot.membership,
        organization.id,
        user.id,
      );

      await this.input.organizationRepository.save(organization);
      await this.input.membershipRepository.save(membership);

      return Object.freeze({
        actorId: user.id,
        organizationId: organization.id,
        membershipId: membership.id,
      });
    });
  }

  private validate(
    registration: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
  ): void {
    registration.user.email.validate();
    registration.user.telephone.validate();
    registration.organization.cnpj.validate();
    registration.organization.slug.validate();

    if (
      this.input.policy.organizationSlugPolicy.isReserved(
        registration.organization.slug.value,
      )
    ) {
      throw OrganizationErrors.reservedSlug(
        registration.organization.slug.value,
      );
    }

    if (
      !this.input.policy.organizationStatusPolicy.isEnabled(
        registration.organization.status,
      )
    ) {
      throw MembershipErrors.organizationNotEnabled(
        registration.organization.id,
      );
    }
  }

  private async ensureOrganizationIsUnique(
    registration: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
  ): Promise<void> {
    const existingByCnpj = await this.input.organizationRepository.findByCnpj(
      registration.organization.cnpj.value,
    );
    if (existingByCnpj) {
      throw OrganizationErrors.cnpjAlreadyExists(
        registration.organization.cnpj.value,
      );
    }

    const existingBySlug = await this.input.organizationRepository.findBySlug(
      registration.organization.slug.value,
    );
    if (existingBySlug) {
      throw OrganizationErrors.slugAlreadyExists(
        registration.organization.slug.value,
      );
    }
  }

  private async authenticateExistingUser(
    password: string,
    user: UserActor<ActorStatus, ActorExtra>,
  ): Promise<UserActor<ActorStatus, ActorExtra>> {
    const authenticated =
      await this.input.executionContext.passwordHashProvider.verify(
        password,
        user.passwordHash,
      );
    if (!authenticated) throw AuthErrors.authFailed();

    if (!this.input.policy.actorStatusPolicy.isEnabled(user.status)) {
      throw OrganizationErrors.organizationOwnerNotEnabled(user.id);
    }

    return user;
  }

  private createUser(
    user: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >['user'],
    passwordHash: string,
  ): UserActor<ActorStatus, ActorExtra> {
    if (!this.input.policy.actorStatusPolicy.isEnabled(user.status)) {
      throw OrganizationErrors.organizationOwnerNotEnabled(user.id);
    }

    const { password: _password, ...data } = user;
    return Object.freeze({
      ...data,
      type: 'USER' as const,
      passwordHash,
      emailVerified: false,
      telephoneVerified: false,
    }) as UserActor<ActorStatus, ActorExtra>;
  }

  private createOrganization(
    organization: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >['organization'],
    ownerActorId: string,
  ): Organization<OrganizationStatus, OrganizationExtra> {
    return Object.freeze({
      ...organization,
      ownerActorId,
    }) as Organization<OrganizationStatus, OrganizationExtra>;
  }

  private createOwnerMembership(
    membership: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >['membership'],
    organizationId: string,
    actorId: string,
  ): Membership<MembershipStatus, MembershipExtra> {
    const permissions: MemberPermission[] = PERMISSION_KEYS.map(
      (permission) => Object.freeze({
        id: this.generateId(),
        membershipId: membership.id,
        permission,
        effect: 'allow' as const,
        createdAt: membership.createdAt,
        createdByActorId: actorId,
      }),
    );

    return Object.freeze({
      ...membership,
      organizationId,
      actorId,
      role: 'owner',
      permissions,
    }) as Membership<MembershipStatus, MembershipExtra>;
  }

  private snapshot(
    registration: OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >,
  ): OrganizationRegistrationInput<
    ActorStatus,
    OrganizationStatus,
    MembershipStatus,
    ActorExtra,
    OrganizationExtra,
    MembershipExtra
  > {
    return Object.freeze({
      user: Object.freeze({ ...registration.user }),
      organization: Object.freeze({ ...registration.organization }),
      membership: Object.freeze({ ...registration.membership }),
    }) as unknown as OrganizationRegistrationInput<
      ActorStatus,
      OrganizationStatus,
      MembershipStatus,
      ActorExtra,
      OrganizationExtra,
      MembershipExtra
    >;
  }

  private generateId(): string {
    return this.input.executionContext.idGenerator?.() ?? crypto.randomUUID();
  }
}
