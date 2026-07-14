import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OrganizationComposition,
  UserComposition,
} from '../../../src/composition/modules/index.ts';

test('Exporta as composições dos módulos', () => {
  assert.equal(typeof OrganizationComposition, 'function');
  assert.equal(typeof UserComposition, 'function');
});
