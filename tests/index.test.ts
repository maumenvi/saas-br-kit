import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Application,
  AppContext,
  ActorComposition,
  AuthComposition,
  AuthUseCase,
  CreateMembershipUseCase,
  MembershipComposition,
  PERMISSION_KEYS,
  pipe,
} from '../src/index.ts';

import { CreateActorUseCase } from '../src/core/entities/actor/application/actor.create.ts';
import { CreateOrganizationUseCase } from '../src/core/entities/organization/index.ts';

test('Exporta a superfície pública principal', () => {
  assert.equal(typeof ActorComposition, 'function');
  assert.equal(typeof Application, 'function');
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof AuthComposition, 'function');
  assert.equal(typeof AuthUseCase, 'function');
  assert.equal(typeof CreateMembershipUseCase, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof CreateActorUseCase, 'function');
  assert.equal(typeof MembershipComposition, 'function');
  assert.equal(PERMISSION_KEYS.length, 12);
  assert.equal(typeof pipe, 'function');
});
