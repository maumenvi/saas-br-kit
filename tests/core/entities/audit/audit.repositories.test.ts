import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuditRepositoryPort } from '../../../../src/core/entities/audit/audit.repositories.ts';

test('AuditRepositoryPort exige a persistência append-only da auditoria', () => {
  const repository: AuditRepositoryPort = {
    save: async () => undefined,
  };

  assert.equal(typeof repository.save, 'function');
});
