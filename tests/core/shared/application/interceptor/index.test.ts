import test from 'node:test';
import assert from 'node:assert/strict';
import { InterceptErrorUseCase } from '../../../../../src/core/shared/application/interceptor/index.ts';

test('Exporta InterceptErrorUseCase', () => {
  assert.equal(typeof InterceptErrorUseCase, 'function');
});
