import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError, ErrorIntercept } from '../../../src/core/shared/index.ts';

test('Exporta os componentes compartilhados', () => {
  assert.equal(typeof DomainError, 'function');
  assert.equal(typeof ErrorIntercept, 'function');
});
