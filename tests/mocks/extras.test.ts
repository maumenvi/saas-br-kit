import test from 'node:test';
import assert from 'node:assert/strict';
import { extras } from '../../src/mocks/extras.ts';

test('Define os tipos extras dos repositórios', () => {
  assert.deepEqual(extras.actors, { birthDate: Date });
  assert.deepEqual(extras.organizations, { inscricaoEstadual: String });
  assert.deepEqual(extras.memberships, { invitedBy: String });
});
