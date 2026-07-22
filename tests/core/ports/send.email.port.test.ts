import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMAIL_MESSAGE_TYPES,
  type SendEmailInput,
  type SendEmailPort,
} from '../../../src/core/ports/send.email.port.ts';

test('Define os tipos de mensagem e o contrato de envio de email', async () => {
  const messages: SendEmailInput[] = [];
  const provider: SendEmailPort = {
    async sendEmail(input) {
      messages.push(input);
    },
  };
  const input: SendEmailInput = {
    type: 'EMAIL_CONFIRMATION',
    actorId: 'actor-1',
    name: 'Marco',
    to: 'marco@example.com',
    verificationId: 'verification-1',
    credential: '123456',
    expiresAt: new Date('2026-07-22T12:15:00.000Z'),
  };

  await provider.sendEmail(input);

  assert.deepEqual(EMAIL_MESSAGE_TYPES, [
    'ORGANIZATION_WELCOME',
    'ORGANIZATION_INVITATION',
    'EMAIL_CONFIRMATION',
  ]);
  assert.deepEqual(messages, [input]);
});
