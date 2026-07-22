import assert from 'node:assert/strict';
import test from 'node:test';
import { composeMembershipChangeStatus } from '../../../../src/composition/modules/membership/membership.change.status.composition.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import {
  membershipCompositionInput,
  membershipFixture,
} from './membership.composition.support.ts';

test('Monta e executa a mudança de status de membership', async () => {
  const repository = new MembershipRepositoryMock();
  const membership = membershipFixture();
  await repository.save(membership);

  await composeMembershipChangeStatus(membershipCompositionInput(repository))(
    membership,
  );

  assert.equal(repository.memberships[0]?.status, 'inactive');
});
