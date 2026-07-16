import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ChangeOrganizationStatusUseCase,
  CNPJ,
  CreateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  OrganizationCreateUseCase,
  OrganizationErrors,
  UpdateOrganizationUseCase,
} from '../../../../src/core/entities/organization/index.ts';

test('Exporta o módulo Organization', () => {
  assert.equal(typeof ChangeOrganizationStatusUseCase, 'function');
  assert.equal(typeof CNPJ, 'function');
  assert.equal(typeof CreateOrganizationUseCase, 'function');
  assert.equal(typeof FindOrganizationByIdUseCase, 'function');
  assert.equal(typeof OrganizationCreateUseCase, 'function');
  assert.equal(typeof OrganizationErrors.invalidCNPJ, 'function');
  assert.equal(typeof UpdateOrganizationUseCase, 'function');
});
