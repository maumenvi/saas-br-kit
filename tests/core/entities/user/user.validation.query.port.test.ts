import assert from 'node:assert/strict';
import test from 'node:test';
import type { UserValidationQueryPort } from '../../../../src/core/entities/user/user.validation.query.port.ts';

test('Define o contrato de dados normalizados para validação de usuário', async () => {
  const query: UserValidationQueryPort = {
    findById: async (id) => ({
      id,
      enabled: true,
      emailVerified: true,
    }),
  };

  assert.deepEqual(await query.findById('user-1'), {
    id: 'user-1',
    enabled: true,
    emailVerified: true,
  });
});
