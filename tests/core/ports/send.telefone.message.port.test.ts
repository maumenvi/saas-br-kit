import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TELEPHONE_MESSAGE_TYPES,
  type SendTelephoneMessageInput,
  type SendTelefoneMessagePort,
} from '../../../src/core/ports/send.telefone.message.port.ts';

test('Define a confirmação telefônica e o contrato de envio', async () => {
  const messages: SendTelephoneMessageInput[] = [];
  const provider: SendTelefoneMessagePort = {
    async sendMessage(input) {
      messages.push(input);
    },
  };
  const input: SendTelephoneMessageInput = {
    type: 'TELEPHONE_CONFIRMATION',
    actorId: 'actor-1',
    name: 'Marco',
    to: '+5511999999999',
    verificationId: 'verification-1',
    credential: '123456',
    expiresAt: new Date('2026-07-22T12:05:00.000Z'),
  };

  await provider.sendMessage(input);

  assert.deepEqual(TELEPHONE_MESSAGE_TYPES, [
    'TELEPHONE_CONFIRMATION',
    'APPOINTMENT_NOTIFICATION',
    'APPOINTMENT_RESPONSE',
  ]);
  assert.deepEqual(messages, [input]);
});
