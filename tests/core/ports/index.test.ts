import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMAIL_MESSAGE_TYPES,
  TELEPHONE_MESSAGE_TYPES,
} from '../../../src/core/ports/index.ts';
import type {
  IdempotencyPort,
  Payload,
  SendEmailPort,
  SendTelefoneMessagePort,
} from '../../../src/core/ports/index.ts';

test('Não necessita teste unitário', () => {
  const payload: Payload = {
    actorId: 'actor-1',
    organizationId: 'organization-1',
  };
  const idempotencyProvider: IdempotencyPort = {
    async acquire(execution) {
      void execution;
      return { status: 'ACQUIRED', leaseId: 'lease-1' };
    },
    async complete() {},
    async release() {},
  };
  const emailProvider: SendEmailPort = {
    async sendEmail() {},
  };
  const telefoneMessageProvider: SendTelefoneMessagePort = {
    async sendMessage() {},
  };

  void payload;
  void idempotencyProvider;
  void emailProvider;
  void telefoneMessageProvider;
  assert.equal(EMAIL_MESSAGE_TYPES.length, 5);
  assert.equal(TELEPHONE_MESSAGE_TYPES.length, 3);
  console.log('Não é necessário teste unitário para src/core/ports/index.ts: exporta apenas contratos TypeScript.');
});
