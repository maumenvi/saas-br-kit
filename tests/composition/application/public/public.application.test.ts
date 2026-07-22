import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublicApplication } from '../../../../src/composition/application/public/public.application.ts';
import {
  type Extras,
  publicApplicationInput,
  type Statuses,
} from './public.application.support.ts';

test('Orquestra os scopes públicos da aplicação', () => {
  const application = createPublicApplication<string, Statuses, Extras>(
    publicApplicationInput(),
  );

  assert.equal(typeof application.auth.authenticate, 'function');
  assert.equal(typeof application.tenant.resolve, 'function');
  assert.equal(Object.isFrozen(application), true);
  assert.equal(Object.isFrozen(application.auth), true);
  assert.equal(Object.isFrozen(application.tenant), true);
});
