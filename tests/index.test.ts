import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Application,
  AppContext,
  CreateMembershipUseCase,
  MembershipComposition,
  pipe,
} from '../src/index.ts';

import { CreateUserUseCase } from '../src/core/entities/user/application/user.create.ts';
import { CreateOrganizationUseCase } from '../src/core/entities/organization/index.ts';

test('Exporta a superfície pública principal', () => {
  assert.equal(typeof Application, 'function');
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof CreateUserUseCase, 'function');
  assert.equal(typeof MembershipComposition, 'function');
  assert.equal(typeof pipe, 'function');
});
