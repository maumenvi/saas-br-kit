import test from 'node:test';
import assert from 'node:assert/strict';
import { ActorComposition } from '../../../src/composition/modules/actor.composition.ts';
import { ExecutionContext } from '../../../src/core/context/execution.context.ts';
import { Email } from '../../../src/core/entities/actor/domain/email.ts';
import { Telephone } from '../../../src/core/entities/actor/domain/telephone.ts';
import type { Actor } from '../../../src/core/entities/actor/actor.ts';
import type { LoggerPort } from '../../../src/core/ports/logger.port.ts';
import { DomainError } from '../../../src/core/shared/domain/domain.error.ts';
import { ActorRepositoryMock } from '../../../src/mocks/actor.repository.ts';
import { DatabaseMock } from '../../../src/mocks/database.ts';
import { LoggerMock } from '../../../src/mocks/logger.ts';
import type { Status } from '../../../src/mocks/status.ts';
import { PasswordHashMock } from '../../../src/mocks/password.hash.ts';

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
  };
}

test('Expõe todos os handlers do módulo Actor', () => {
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
  });

  const composition = new ActorComposition<Status>({
    executionContext,
    actorRepository: new ActorRepositoryMock(),
    policy: { actorStatusPolicy },
  });

  assert.equal(typeof composition.create, 'function');
  assert.equal(typeof composition.update, 'function');
  assert.equal(typeof composition.changeStatus, 'function');
  assert.equal(typeof composition.findById, 'function');
  assert.equal(typeof composition.findByEmail, 'function');
  assert.equal(typeof composition.findByTelephone, 'function');
  assert.equal(typeof composition.findByName, 'function');
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
    policy: { actorStatusPolicy },
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
