import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORGANIZATION_ERROR_CODE,
  OrganizationErrors,
} from '../../../../../src/core/entities/organization/domain/organization.errors.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';

test('Cria erro de organização não encontrada', () => {
  const error = OrganizationErrors.notFound('organization-1');

  assert.ok(error instanceof DomainError);
  assert.equal(error.code, ORGANIZATION_ERROR_CODE.ORGANIZATION_NOT_FOUND);
  assert.equal(error.target, 'src/core/organization/domain/organization.ts');
  assert.match(error.message, /organization-1/);
});

test('Cria erro de organização já existente', () => {
  const error = OrganizationErrors.alreadyExists('organization@example.com');

  assert.equal(error.code, ORGANIZATION_ERROR_CODE.ORGANIZATION_ALREADY_EXISTS);
  assert.match(error.message, /organization@example\.com/);
});

test('Cria erro de CNPJ inválido', () => {
  const error = OrganizationErrors.invalidCNPJ('invalid-cnpj');

  assert.equal(error.code, ORGANIZATION_ERROR_CODE.ORGANIZATION_INVALID_CNPJ);
  assert.match(error.message, /invalid-cnpj/);
});
