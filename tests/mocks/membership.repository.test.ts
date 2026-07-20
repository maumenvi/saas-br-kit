import assert from 'node:assert/strict';
import test from 'node:test';
import type { Membership } from '../../src/core/entities/membership/membership.ts';
import { MembershipRepositoryMock } from '../../src/mocks/membership.repository.ts';
import type { Status } from '../../src/mocks/status.ts';

function membership(
  id: string,
  organizationId: string,
  actorId: string,
): Membership<Status> {
  return {
    id,
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    status: 'active',
    organizationId,
    actorId,
    role: 'owner',
    permissions: [],
  };
}

test('Persiste e consulta memberships pelos identificadores semânticos', async () => {
  const repository = new MembershipRepositoryMock();
  const first = membership('membership-1', 'organization-1', 'actor-1');
  const second = membership('membership-2', 'organization-1', 'actor-2');
  await repository.save(first);
  await repository.save(second);

  assert.equal(await repository.findById(first.id), first);
  assert.deepEqual(await repository.findByOrganizationId('organization-1'), [first, second]);
  assert.deepEqual(await repository.findByActorId('actor-2'), [second]);

  const updated = { ...first, role: 'admin' };
  await repository.update(updated);
  assert.equal(await repository.findById(first.id), updated);

  await repository.changeStatus(updated);
  assert.equal(repository.memberships[0]?.status, 'inactive');
});
