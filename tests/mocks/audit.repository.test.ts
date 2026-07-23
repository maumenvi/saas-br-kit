import assert from 'node:assert/strict';
import test from 'node:test';
import type { Audit } from '../../src/core/entities/audit/audit.ts';
import { AuditRepositoryMock } from '../../src/mocks/audit.repository.ts';

test('AuditRepositoryMock armazena auditorias de forma append-only', async () => {
  const repository = new AuditRepositoryMock();
  const audit = {
    id: 'audit-1',
    action: 'actor:create',
    outcome: 'SUCCESS',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    membershipId: 'membership-1',
    input: {},
    output: null,
    error: null,
    startedAt: new Date('2026-07-21T12:00:00.000Z'),
    completedAt: new Date('2026-07-21T12:00:00.010Z'),
    durationMs: 10,
  } satisfies Audit;

  await repository.save(audit);

  assert.deepEqual(repository.audits, [audit]);
});
