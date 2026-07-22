import assert from 'node:assert/strict';
import test from 'node:test';
import { composeMembershipRequestOrganizationInvitation } from '../../../../src/composition/modules/membership/membership.invitation.composition.ts';
import {
  membershipCompositionInput,
  membershipFixture,
} from './membership.composition.support.ts';

test('Compõe solicitação de convite protegida por membership:create', async () => {
  const input = membershipCompositionInput();
  const output = await composeMembershipRequestOrganizationInvitation(input)(
    membershipFixture(),
  );
  assert.equal(output.purpose, 'ORGANIZATION_INVITATION');
  assert.equal(await input.membershipRepository.findById('membership-1'), null);
});
