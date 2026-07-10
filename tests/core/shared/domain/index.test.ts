import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../../src/core/shared/domain/index.ts';

test('Exporta DomainError', () => {
  assert.equal(typeof DomainError, 'function');
});
