import test from 'node:test';
import assert from 'node:assert/strict';
import type { MemberPermission } from '../../../../src/core/entities/membership/membership.ts';

test('Aceita uma permissão do catálogo no override do membro', () => {
  const override = {
    id: 'override-1',
    membershipId: 'membership-1',
    permission: 'organization:update',
    effect: 'deny',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    createdByActorId: 'actor-owner-1',
  } satisfies MemberPermission;

  assert.equal(override.permission, 'organization:update');
  assert.equal(override.effect, 'deny');
});
