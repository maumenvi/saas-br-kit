import test from 'node:test';
import assert from 'node:assert/strict';
import { AppContext, ExecutionContext } from '../../../src/core/context/index.ts';

test('Exporta os contextos', () => {
  assert.equal(typeof AppContext, 'function');
  assert.equal(typeof ExecutionContext, 'function');
});
