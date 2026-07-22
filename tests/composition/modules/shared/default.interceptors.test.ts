import assert from 'node:assert/strict';
import test from 'node:test';
import type { PermissionContext } from '../../../../src/core/access-control/permission.intercept.ts';
import { ExecutionContext } from '../../../../src/core/context/execution.context.ts';
import { DomainError } from '../../../../src/core/shared/domain/domain.error.ts';
import { withDefaultInterceptors } from '../../../../src/composition/modules/shared/default.interceptors.ts';
import { AuditRepositoryMock } from '../../../../src/mocks/audit.repository.ts';
import { DatabaseMock } from '../../../../src/mocks/database.ts';
import { IdempotencyMock } from '../../../../src/mocks/idempotency.ts';
import { LoggerMock } from '../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../src/mocks/password.hash.ts';

function executionContext(idempotencyProvider = new IdempotencyMock()) {
  return new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
    idempotencyProvider,
  });
}

const permissionContext: PermissionContext = {
  id: 'membership-1',
  actorId: 'actor-1',
  organizationId: 'organization-1',
  permissions: [
    {
      membershipId: 'membership-1',
      permission: 'actor:create',
      effect: 'allow',
    },
  ],
};

test('Monta o pipeline protegido padrão com auditoria e idempotência', async () => {
  const idempotencyProvider = new IdempotencyMock();
  const auditRepository = new AuditRepositoryMock();
  const handler = withDefaultInterceptors(
    async (input: { name: string }) => input.name,
    {
      action: 'actor:create',
      permission: 'actor:create',
      permissionContext,
      executionContext: executionContext(idempotencyProvider),
      auditRepository,
    },
  );

  assert.equal(await handler({ name: 'Marco' }), 'Marco');
  assert.deepEqual(idempotencyProvider.actions, ['actor:create']);
  assert.deepEqual(idempotencyProvider.executions[0]?.identity, {
    actorId: 'actor-1',
    organizationId: 'organization-1',
  });
  assert.equal(auditRepository.audits[0]?.action, 'actor:create');
});

test('Interrompe antes da idempotência quando a permissão é negada', async () => {
  const idempotencyProvider = new IdempotencyMock();
  let executed = false;
  const handler = withDefaultInterceptors(
    async () => {
      executed = true;
    },
    {
      action: 'actor:create',
      permission: 'actor:create',
      permissionContext: { ...permissionContext, permissions: [] },
      executionContext: executionContext(idempotencyProvider),
      auditRepository: new AuditRepositoryMock(),
    },
  );

  await assert.rejects(
    handler(undefined),
    (error) =>
      error instanceof DomainError &&
      error.code === 'ACCESS_CONTROL_PERMISSION_DENIED',
  );

  assert.equal(executed, false);
  assert.deepEqual(idempotencyProvider.actions, []);
});

test('Permite desativar idempotência para outputs sensíveis', async () => {
  const idempotencyProvider = new IdempotencyMock();
  const handler = withDefaultInterceptors(
    async () => ({ secret: 'one-time-secret' }),
    {
      action: 'mfa:create-key',
      idempotent: false,
      executionContext: executionContext(idempotencyProvider),
      auditRepository: new AuditRepositoryMock(),
    },
  );

  assert.deepEqual(await handler(undefined), { secret: 'one-time-secret' });
  assert.deepEqual(idempotencyProvider.actions, []);
});
