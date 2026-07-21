import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUDIT_OUTCOMES,
  type Audit,
} from '../../../../src/core/entities/audit/audit.ts';

test('Define os resultados possíveis e os dados completos de uma auditoria', () => {
  const audit: Audit = {
    id: 'audit-1',
    action: 'actor:update',
    outcome: 'SUCCESS',
    actorId: 'actor-1',
    organizationId: 'organization-1',
    membershipId: 'membership-1',
    input: { name: 'Marco' },
    output: null,
    error: null,
    startedAt: new Date('2026-07-21T10:00:00.000Z'),
    completedAt: new Date('2026-07-21T10:00:00.010Z'),
    durationMs: 10,
  };

  assert.deepEqual(AUDIT_OUTCOMES, ['SUCCESS', 'ERROR']);
  assert.equal(audit.action, 'actor:update');
  assert.equal(audit.actorId, 'actor-1');
});
