import assert from 'node:assert/strict';
import test from 'node:test';
import { OrganizationSlug } from '../../../../../src/core/entities/organization/domain/organization.slug.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';

test('Normaliza e valida um slug de organização', () => {
  const slug = new OrganizationSlug('  Minha-Empresa  ');

  assert.equal(slug.value, 'minha-empresa');
  assert.equal(Object.isFrozen(slug), true);
  assert.doesNotThrow(() => slug.validate());
});

test('Aceita os limites de um label DNS', () => {
  assert.doesNotThrow(() => new OrganizationSlug('a').validate());
  assert.doesNotThrow(() => new OrganizationSlug('a'.repeat(63)).validate());
});

test('Rejeita valores incompatíveis com um label DNS', () => {
  const invalidSlugs = [
    '',
    'a'.repeat(64),
    '-acme',
    'acme-',
    'acme.test',
    'acme_test',
    'acme test',
    'ação',
  ];

  for (const value of invalidSlugs) {
    assert.throws(
      () => new OrganizationSlug(value).validate(),
      (error) =>
        error instanceof DomainError &&
        error.code === 'ORGANIZATION_INVALID_SLUG',
      value,
    );
  }
});
