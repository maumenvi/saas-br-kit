import assert from 'node:assert/strict';
import test from 'node:test';
import { composeMembershipCreate } from '../../../../src/composition/modules/membership/membership.create.composition.ts';
import { MembershipRepositoryMock } from '../../../../src/mocks/membership.repository.ts';
import {
  membershipCompositionInput,
  membershipFixture,
} from './membership.composition.support.ts';

test('Monta e executa o create de membership', async () => {
  const repository = new MembershipRepositoryMock();
  const membership = membershipFixture();

  await composeMembershipCreate(membershipCompositionInput(repository))(
    membership,
  );

  assert.equal(await repository.findById(membership.id), membership);
});
