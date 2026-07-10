import test from 'node:test';
import assert from 'node:assert/strict';
import { UserComposition } from '../../../src/composition/modules/index.ts';

test('Exporta UserComposition', () => {
  assert.equal(typeof UserComposition, 'function');
});
