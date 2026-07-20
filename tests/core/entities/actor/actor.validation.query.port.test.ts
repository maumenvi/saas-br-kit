import assert from 'node:assert/strict';
import test from 'node:test';
import type { ActorValidationQueryPort } from '../../../../src/core/entities/actor/actor.validation.query.port.ts';

test('Define o contrato de dados normalizados para validação de actor', async () => {
  const query: ActorValidationQueryPort = {
    findById: async (id) => ({
      id,
      type: 'USER',
      enabled: true,
      emailVerified: true,
    }),
  };

  assert.deepEqual(await query.findById('user-1'), {
    id: 'user-1',
    type: 'USER',
    enabled: true,
    emailVerified: true,
  });
});
