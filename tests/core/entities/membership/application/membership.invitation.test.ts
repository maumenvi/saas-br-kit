import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { RequestMembershipInvitationUseCase } from '../../../../../src/core/entities/membership/application/membership.invitation.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { MembershipRepositoryMock } from '../../../../../src/mocks/membership.repository.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import { verificationConfigMock } from '../../../../../src/mocks/verification.credential.ts';
import { VerificationRepositoryMock } from '../../../../../src/mocks/verification.repository.ts';

test('Cria verificação de convite sem criar membership antes do aceite', async () => {
  const memberships = new MembershipRepositoryMock();
  const verifications = new VerificationRepositoryMock();
  const useCase = new RequestMembershipInvitationUseCase({
    executionContext: new ExecutionContext({
      databaseProvider: new DatabaseMock(), loggerProvider: new LoggerMock(),
      passwordHashProvider: new PasswordHashMock(), idGenerator: () => 'verification-1',
    }),
    membershipRepository: memberships,
    verificationRepository: verifications,
    verification: verificationConfigMock(),
    actorValidationQuery: {
      findById: async id => ({
        id, type: 'USER', enabled: true, emailVerified: true,
        telephoneVerified: true, email: 'actor@example.com',
      }),
    },
    organizationValidationQuery: {
      findById: async id => ({ id, enabled: true }),
    },
  });
  const output = await useCase.execute({
    id: 'membership-1', actorId: 'actor-1', organizationId: 'organization-1',
    role: 'member', permissions: [], status: 'active',
    createdAt: new Date(), updatedAt: new Date(),
  });
  assert.equal(output.purpose, 'ORGANIZATION_INVITATION');
  assert.equal(memberships.memberships.length, 0);
  assert.equal(verifications.verifications[0]?.organizationId, 'organization-1');
});
