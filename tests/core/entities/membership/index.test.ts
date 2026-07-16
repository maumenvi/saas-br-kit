import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ChangeMembershipStatusUseCase,
  CreateMembershipUseCase,
  FindMembershipByIdUseCase,
  MEMBERSHIP_ERROR_CODE,
  MembershipErrors,
  UpdateMembershipUseCase,
} from '../../../../src/core/entities/membership/index.ts';

test('Exporta os casos de uso do módulo Membership', () => {
  assert.equal(typeof ChangeMembershipStatusUseCase, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof FindMembershipByIdUseCase, 'function');
  assert.equal(typeof MEMBERSHIP_ERROR_CODE, 'object');
  assert.equal(typeof MembershipErrors, 'object');
  assert.equal(typeof UpdateMembershipUseCase, 'function');
});
