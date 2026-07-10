import test from 'node:test';
import assert from 'node:assert/strict';
import { InterceptErrorUseCase } from '../../../../src/core/shared/application/index.ts';

test('Exporta os componentes de Application compartilhados', () => {
  assert.equal(typeof InterceptErrorUseCase, 'function');
});
