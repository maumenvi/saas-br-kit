import test from 'node:test';
import assert from 'node:assert/strict';
import { ActorComposition } from '../../../../src/composition/modules/actor/actor.composition.ts';
import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { Email } from '../../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../../src/core/entities/actor/domain/telephone.ts';
import type { Actor } from '../../../../src/core/entities/actor/actor.ts';
import type { LoggerPort } from '../../../../src/core/ports/logger.port.ts';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { IdempotencyMock } from '../../../../src/mocks/idempotency.ts';
import type { Status } from '../../../../src/mocks/status.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../src/mocks/verification.repository.ts';

const actorStatusPolicy = {
  isEnabled: (status: Status) => status === 'active',
};

type ErrorLog = {
  message: string;
  args: unknown[];
};

class RecordingLogger implements LoggerPort {
  readonly errors: ErrorLog[] = [];

  error(message: string, ...args: unknown[]): void {
    this.errors.push({ message, args });
  }

  warn(): void { }

  info(): void { }

  debug(): void { }
}

function validActor(): Actor<Status> {
  return {
    id: 'actor-1',
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    status: 'active',
    type: 'USER',
    name: 'Marco',
    email: new Email('marco@example.com'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
    telephoneVerified: true,
  };
}

const permissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [
    'actor:create',
    'actor:update',
    'actor:change-status',
    'actor:find',
  ].map((permission) => ({
    membershipId: 'membership-1',
    permission: permission as PermissionContext['permissions'][number]['permission'],
    effect: 'allow',
  })),
};

test('Expõe todos os handlers do módulo Actor', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  });

  const composition = new ActorComposition<Status>({
    executionContext,
    actorRepository: new ActorRepositoryMock(),
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: { actorStatusPolicy },
  });

  assert.equal(typeof composition.create, 'function');
  assert.equal(typeof composition.update, 'function');
  assert.equal(typeof composition.changeStatus, 'function');
  assert.equal(typeof composition.findById, 'function');
  assert.equal(typeof composition.findByEmail, 'function');
  assert.equal(typeof composition.findByTelephone, 'function');
  assert.equal(typeof composition.findByName, 'function');
  assert.equal(typeof composition.sendOrganizationWelcomeEmail, 'function');
  assert.equal(typeof composition.sendOrganizationInvitationEmail, 'function');
  assert.equal(typeof composition.requestEmailConfirmation, 'function');
  assert.equal(typeof composition.requestTelephoneConfirmation, 'function');
});

test('Executa todos os handlers com o repository configurado', async () => {
  const database = new DatabaseMock();
  const actors = new ActorRepositoryMock();
  const composition = new ActorComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
    }),
    actorRepository: actors,
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: { actorStatusPolicy },
    permissionContext,
  });
  const actor = validActor();

  await composition.create(actor);

  assert.equal(await composition.findById(actor.id), actor);
  if (actor.type !== 'USER') throw new Error('Expected USER actor fixture');
  assert.equal(await composition.findByEmail(actor.email.value), actor);
  assert.equal(await composition.findByTelephone(actor.telephone.value), actor);
  assert.deepEqual(await composition.findByName(actor.name), [actor]);

  const updatedActor = {
    ...actor,
    name: 'Marco Aurelio',
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
  };
  await composition.update(updatedActor);
  assert.equal(await composition.findById(actor.id), updatedActor);

  await composition.changeStatus(updatedActor);
  assert.equal(actors.actors[0]?.status, 'inactive');
});

test('Executa o create pelo pipe e registra erros de domínio', async () => {
  const logger = new RecordingLogger();
  const database = new DatabaseMock();
  const composition = new ActorComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: database,
      loggerProvider: logger,
      passwordHashProvider: new PasswordHashMock(),
    }),
    actorRepository: new ActorRepositoryMock(),
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: { actorStatusPolicy },
  });
  const actor = {
    id: 'actor-1',
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    status: 'active' as Status,
    type: 'USER' as const,
    name: 'Marco',
    email: new Email('invalid-email'),
    telephone: new Telephone('+5511999999999'),
    passwordHash: 'hashed-password',
    emailVerified: true,
    telephoneVerified: true,
  };

  await assert.rejects(
    composition.create(actor),
    (error) =>
      error instanceof DomainError && error.code === 'ACTOR_INVALID_EMAIL',
  );

  assert.deepEqual(logger.errors, [
    {
      message: 'Actor with email invalid-email is invalid.',
      args: [
        {
          code: 'ACTOR_INVALID_EMAIL',
          target: 'src/core/entities/actor/domain/actor.ts',
          details: {},
        },
      ],
    },
  ]);
  assert.equal(database.started, 0);
});

test('Inclui idempotência no pipe somente quando o provider é injetado', async () => {
  const idempotencyProvider = new IdempotencyMock();
  const composition = new ActorComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      idempotencyProvider,
    }),
    actorRepository: new ActorRepositoryMock(),
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: { actorStatusPolicy },
    permissionContext,
  });

  await composition.create(validActor());

  assert.deepEqual(idempotencyProvider.actions, ['actor:create']);
  assert.deepEqual(idempotencyProvider.executions[0]?.identity, {
    actorId: permissionContext.actorId,
    organizationId: permissionContext.organizationId,
  });
  assert.match(
    idempotencyProvider.executions[0]?.fingerprint ?? '',
    /^[a-f0-9]{64}$/,
  );
  assert.match(idempotencyProvider.executions[0]?.key ?? '', /^[a-f0-9]{64}$/);
});

test('Executa a autorização antes do provider de idempotência', async () => {
  const idempotencyProvider = new IdempotencyMock();
  const composition = new ActorComposition<Status>({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(),
      loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(),
      idempotencyProvider,
    }),
    actorRepository: new ActorRepositoryMock(),
    verificationRepository: new VerificationRepositoryMock(),
    verification: verificationConfigMock(),
    auditRepository: new AuditRepositoryMock(),
    policy: { actorStatusPolicy },
    permissionContext: {
      ...permissionContext,
      permissions: [],
    },
  });

  await assert.rejects(
    composition.create(validActor()),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ACCESS_CONTROL_PERMISSION_DENIED',
  );

  assert.deepEqual(idempotencyProvider.actions, []);
});
