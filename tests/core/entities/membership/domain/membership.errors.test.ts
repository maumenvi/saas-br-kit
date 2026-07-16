import assert from 'node:assert/strict';
import test from 'node:test';
import { MembershipErrors, MEMBERSHIP_ERROR_CODE } from '../../../../../src/core/entities/membership/domain/membership.errors.ts';
import { DomainError } from '../../../../../src/core/shared/domain/domain.error.ts';

test('Cria erros estáveis para referências inválidas da membership', () => {
  const userError = MembershipErrors.userNotFound('user-1');
  const userDisabledError = MembershipErrors.userNotEnabled('user-1');
  const organizationError = MembershipErrors.organizationNotFound('organization-1');
  const organizationDisabledError = MembershipErrors.organizationNotEnabled('organization-1');

  assert.ok(userError instanceof DomainError);
  assert.equal(userError.code, MEMBERSHIP_ERROR_CODE.MEMBERSHIP_USER_NOT_FOUND);
  assert.equal(
    userDisabledError.code,
    MEMBERSHIP_ERROR_CODE.MEMBERSHIP_USER_NOT_ENABLED,
  );
  assert.ok(organizationError instanceof DomainError);
  assert.equal(
    organizationError.code,
    MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ORGANIZATION_NOT_FOUND,
  );
  assert.equal(
    organizationDisabledError.code,
    MEMBERSHIP_ERROR_CODE.MEMBERSHIP_ORGANIZATION_NOT_ENABLED,
  );
});
