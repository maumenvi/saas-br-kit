import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ChangeMembershipStatusUseCase,
  CreateMembershipUseCase,
  FindMembershipByIdUseCase,
  MEMBERSHIP_ERROR_CODE,
  MembershipErrors,
  type MemberPermissionOverride,
  UpdateMembershipUseCase,
} from '../../../../src/core/entities/membership/index.ts';

test('Exporta os casos de uso do módulo Membership', () => {
  assert.equal(typeof ChangeMembershipStatusUseCase, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof FindMembershipByIdUseCase, 'function');
  assert.equal(typeof MEMBERSHIP_ERROR_CODE, 'object');
  assert.equal(typeof MembershipErrors, 'object');
  assert.equal(typeof UpdateMembershipUseCase, 'function');

  const override = {
    id: 'override-1',
    membershipId: 'membership-1',
    permission: 'membership:update',
    effect: 'allow',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    createdByUserId: 'owner-1',
  } satisfies MemberPermissionOverride;

  assert.equal(override.permission, 'membership:update');
});
