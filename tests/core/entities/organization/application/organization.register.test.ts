import assert from 'node:assert/strict';
import test from 'node:test';
import { PERMISSION_KEYS } from '../../../../../src/core/access-control/permission.catalog.ts';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../../src/core/entities/actor/domain/telephone.ts';
import type { UserActor } from '../../../../../src/core/entities/actor/actor.ts';
import type { MembershipRepositoryPort } from '../../../../../src/core/entities/membership/membership.repositories.ts';
import { CNPJ } from '../../../../../src/core/shared/domain/cnpj.ts';
import { OrganizationSlug } from '../../../../../src/core/entities/organization/domain/organization.slug.ts';
import { RegisterOrganizationUseCase } from '../../../../../src/core/entities/organization/application/organization.register.ts';
import type { OrganizationRegistrationInput } from '../../../../../src/core/entities/organization/application/organization.registration.input.ts';
import { ActorRepositoryMock } from '../../../../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../../src/mocks/membership.repository.ts';
import { OrganizationRepositoryMock } from '../../../../../src/mocks/organization.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import {
  PolicyActor,
  PolicyOrganization,
  PolicyOrganizationSlug,
  type Status,
} from '../../../../../src/mocks/status.ts';

type RegistrationInput = OrganizationRegistrationInput<Status, Status, Status>;

function registrationFixture(): RegistrationInput {
  const timestamp = new Date('2026-07-22T12:00:00.000Z');

  return {
    user: {
      id: 'actor-new',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
      name: 'Marco',
      email: new Email('marco@example.com'),
      telephone: new Telephone('+5511999999999'),
      password: 'safe-password',
    },
    organization: {
      id: 'organization-new',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
      name: 'Maumenvi',
      slug: new OrganizationSlug('maumenvi'),
      cnpj: new CNPJ('90.021.382/0001-22'),
    },
    membership: {
      id: 'membership-new',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
    },
  };
}

function setup() {
  const database = new DatabaseMock();
  const actors = new ActorRepositoryMock();
  const organizations = new OrganizationRepositoryMock();
  const memberships = new MembershipRepositoryMock();
  let generatedId = 0;

  const executionContext = new ExecutionContext({
    databaseProvider: database,
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
    idGenerator: () => `generated-${++generatedId}`,
  });

  const useCase = new RegisterOrganizationUseCase({
    executionContext,
    actorRepository: actors,
    organizationRepository: organizations,
    membershipRepository: memberships,
    policy: {
      actorStatusPolicy: new PolicyActor(),
      organizationStatusPolicy: new PolicyOrganization(),
      organizationSlugPolicy: new PolicyOrganizationSlug(),
    },
  });

  return { database, actors, organizations, memberships, useCase };
}

test('Cria somente actor USER, organização e membership owner na mesma transação', async () => {
  const { database, actors, organizations, memberships, useCase } = setup();
  const registration = registrationFixture();

  const output = await useCase.execute(registration);

  const user = actors.actors[0] as UserActor<Status>;
  assert.equal(user.type, 'USER');
  assert.equal(user.passwordHash, 'hashed-safe-password');
  assert.equal(user.emailVerified, false);
  assert.equal(user.id, registration.user.id);

  const organization = organizations.organizations[0];
  assert.equal(organization?.ownerActorId, user.id);

  const membership = memberships.memberships[0];
  assert.equal(membership?.actorId, user.id);
  assert.equal(membership?.organizationId, organization?.id);
  assert.equal(membership?.role, 'owner');
  assert.deepEqual(
    membership?.permissions.map(({ permission, effect }) => ({ permission, effect })),
    PERMISSION_KEYS.map((permission) => ({ permission, effect: 'allow' })),
  );
  assert.equal(
    membership?.permissions.every(
      ({ membershipId, createdByActorId }) =>
        membershipId === membership.id && createdByActorId === user.id,
    ),
    true,
  );
  assert.deepEqual(output, {
    actorId: user.id,
    organizationId: organization?.id,
    membershipId: membership?.id,
  });
  assert.equal(Object.isFrozen(output), true);
  assert.equal(database.started, 1);
  assert.equal(database.commited, 1);
  assert.equal(database.rolledback, 0);
});

test('Reutiliza usuário autenticado por e-mail sem alterar seus dados', async () => {
  const { actors, organizations, memberships, useCase } = setup();
  const existingUser: UserActor<Status> = {
    id: 'actor-existing',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Nome original',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511888888888'),
    passwordHash: 'hashed-safe-password',
    emailVerified: true,
    telephoneVerified: true,
  };
  await actors.save(existingUser);

  const before = structuredClone({
    id: existingUser.id,
    name: existingUser.name,
    telephone: existingUser.telephone.value,
    passwordHash: existingUser.passwordHash,
    emailVerified: existingUser.emailVerified,
    telephoneVerified: existingUser.emailVerified,
  });

  const output = await useCase.execute(registrationFixture());

  assert.equal(actors.actors.length, 1);
  assert.strictEqual(actors.actors[0], existingUser);
  assert.deepEqual(
    {
      id: existingUser.id,
      name: existingUser.name,
      telephone: existingUser.telephone.value,
      passwordHash: existingUser.passwordHash,
      emailVerified: existingUser.emailVerified,
      telephoneVerified: existingUser.emailVerified,
    },
    before,
  );
  assert.equal(organizations.organizations[0]?.ownerActorId, existingUser.id);
  assert.equal(memberships.memberships[0]?.actorId, existingUser.id);
  assert.equal(output.actorId, existingUser.id);
});

test('Rejeita senha inválida do usuário existente sem gravar organização', async () => {
  const { database, actors, organizations, memberships, useCase } = setup();
  await actors.save({
    id: 'actor-existing',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511888888888'),
    passwordHash: 'hashed-another-password',
    emailVerified: true,
    telephoneVerified: true,
  });

  await assert.rejects(useCase.execute(registrationFixture()), {
    code: 'AUTH_FAILED',
  });

  assert.equal(actors.actors.length, 1);
  assert.deepEqual(organizations.organizations, []);
  assert.deepEqual(memberships.memberships, []);
  assert.equal(database.rolledback, 1);
});

test('Rejeita CNPJ e URL já existentes com erros específicos', async () => {
  const cnpjSetup = setup();
  const registration = registrationFixture();
  await cnpjSetup.organizations.save({
    ...registration.organization,
    id: 'organization-existing',
    ownerActorId: 'actor-existing',
  });

  await assert.rejects(cnpjSetup.useCase.execute(registration), {
    code: 'ORGANIZATION_CNPJ_ALREADY_EXISTS',
  });
  assert.equal(cnpjSetup.database.rolledback, 1);

  const slugSetup = setup();
  await slugSetup.organizations.save({
    ...registration.organization,
    id: 'organization-existing',
    cnpj: new CNPJ('11.444.777/0001-61'),
    ownerActorId: 'actor-existing',
  });

  await assert.rejects(
    slugSetup.useCase.execute(registration),
    (error) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'ORGANIZATION_SLUG_ALREADY_EXISTS' &&
      error.message.includes('Choose another URL'),
  );
  assert.equal(slugSetup.database.rolledback, 1);
});

test('Valida os value objects e slug reservado antes da transação', async () => {
  const invalid = setup();
  await assert.rejects(
    invalid.useCase.execute({
      ...registrationFixture(),
      user: {
        ...registrationFixture().user,
        email: new Email('invalid-email'),
      },
    }),
    { code: 'ACTOR_INVALID_EMAIL' },
  );
  assert.equal(invalid.database.started, 0);

  const reserved = setup();
  await assert.rejects(
    reserved.useCase.execute({
      ...registrationFixture(),
      organization: {
        ...registrationFixture().organization,
        slug: new OrganizationSlug('admin'),
      },
    }),
    { code: 'ORGANIZATION_SLUG_RESERVED' },
  );
  assert.equal(reserved.database.started, 0);
});

test('Propaga falha de persistência para o rollback da operação completa', async () => {
  const { database, actors, organizations, memberships, useCase } = setup();
  const failure = new Error('Membership repository failed');
  (memberships as MembershipRepositoryPort<Status>).save = async () => {
    throw failure;
  };

  await assert.rejects(useCase.execute(registrationFixture()), (error) => error === failure);

  assert.equal(actors.actors.length, 1);
  assert.equal(organizations.organizations.length, 1);
  assert.equal(database.commited, 0);
  assert.equal(database.rolledback, 1);
});
