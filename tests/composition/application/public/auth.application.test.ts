import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthApplication } from '../../../../src/composition/application/public/auth.application.ts';
import { publicApplicationInput } from './public.application.support.ts';

test('Monta somente a superfície pública de autenticação', () => {
  const input = publicApplicationInput();
  const auth = createAuthApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    actorRepositoryPort: input.repositories.actors,
    membershipRepository: input.repositories.memberships,
    mfaRepository: input.repositories.mfas,
    mfaProvider: input.mfa.provider,
    authentication: input.authentication,
  });

  assert.equal(typeof auth.authenticate, 'function');
  assert.equal('logger' in auth, false);
  assert.equal(Object.isFrozen(auth), true);
});
