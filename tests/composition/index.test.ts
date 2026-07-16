import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Application,
  OrganizationComposition,
  pipe,
  UserComposition,
} from '../../src/composition/index.ts';

test('Exporta a composição pública', () => {
  assert.equal(typeof Application, 'function');
  assert.equal(typeof OrganizationComposition, 'function');
  assert.equal(typeof pipe, 'function');
  assert.equal(typeof UserComposition, 'function');
});
