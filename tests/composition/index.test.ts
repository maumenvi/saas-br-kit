import test from 'node:test';
import assert from 'node:assert/strict';
import { Aplication, UserComposition } from '../../src/composition/index.ts';

test('Exporta a composição pública', () => {
  assert.equal(typeof Aplication, 'function');
  assert.equal(typeof UserComposition, 'function');
});
