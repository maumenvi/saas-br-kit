import assert from 'node:assert/strict';
import test from 'node:test';
import { createRegistrationApplication } from '../../../../src/composition/application/public/registration.application.ts';
import { publicApplicationInput } from './public.application.support.ts';

test('Monta somente a superfície pública do cadastro de organização', () => {
  const input = publicApplicationInput();
  const registration = createRegistrationApplication({
    executionContext: input.executionContext,
    auditRepository: input.repositories.audits,
    actorRepository: input.repositories.actors,
    organizationRepository: input.repositories.organizations,
    membershipRepository: input.repositories.memberships,
    verificationRepository: input.repositories.verifications,
    verification: input.verification,
    policy: {
      actorStatusPolicy: input.policy.actor.actorStatusPolicy,
      organizationStatusPolicy:
        input.policy.organization.organizationStatusPolicy,
      organizationSlugPolicy:
        input.policy.organization.organizationSlugPolicy,
    },
  });

  assert.equal(typeof registration.createOrganization, 'function');
  assert.equal(typeof registration.sendOrganizationWelcomeEmail, 'function');
  assert.equal(typeof registration.requestEmailConfirmation, 'function');
  assert.equal(typeof registration.requestTelephoneConfirmation, 'function');
  assert.equal('logger' in registration, false);
  assert.equal(Object.isFrozen(registration), true);
});
