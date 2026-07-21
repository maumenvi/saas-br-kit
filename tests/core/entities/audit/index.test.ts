import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUDIT_OUTCOMES,
  AuditIntercept,
  type Audit,
  type AuditRepositoryPort,
} from '../../../../src/core/entities/audit/index.ts';

test('Expõe a superfície pública do módulo de auditoria', () => {
  const audit = null as Audit | null;
  const repository = null as AuditRepositoryPort | null;

  assert.deepEqual(AUDIT_OUTCOMES, ['SUCCESS', 'ERROR']);
  assert.equal(typeof AuditIntercept, 'function');
  assert.equal(audit, null);
  assert.equal(repository, null);
});
