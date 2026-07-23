import assert from 'node:assert/strict';
import test from 'node:test';
import { composeMembershipUpdate } from '../../../../src/composition/modules/membership/membership.update.composition.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import {
  membershipCompositionInput,
  membershipFixture,
} from './membership.composition.support.ts';

test('Monta e executa o update de membership', async () => {
  const repository = new MembershipRepositoryMock();
  const membership = membershipFixture();
  const updated = { ...membership, role: 'admin' };
  await repository.save(membership);

  await composeMembershipUpdate(membershipCompositionInput(repository))(
    updated,
  );

  assert.equal(await repository.findById(membership.id), updated);
});
