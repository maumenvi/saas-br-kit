import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeMembershipFindByActorId,
  composeMembershipFindById,
  composeMembershipFindByOrganizationId,
} from '../../../../src/composition/modules/membership/membership.find.composition.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import {
  membershipCompositionInput,
  membershipFixture,
} from './membership.composition.support.ts';

test('Monta e executa as consultas de membership', async () => {
  const repository = new MembershipRepositoryMock();
  const membership = membershipFixture();
  const input = membershipCompositionInput(repository);
  await repository.save(membership);

  assert.equal(
    await composeMembershipFindById(input)(membership.id),
    membership,
  );
  assert.deepEqual(
    await composeMembershipFindByOrganizationId(input)(
      membership.organizationId,
    ),
    [membership],
  );
  assert.deepEqual(
    await composeMembershipFindByActorId(input)(membership.actorId),
    [membership],
  );
});
