import test from 'node:test';
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
    async sendEmail(input) {
      return input;
    },
  };
  const telefoneMessageProvider: SendTelefoneMessagePort = {
    async sendMessage(input) {
      return input;
    },
  };

  void payload;
  void idempotencyProvider;
  void emailProvider;
  void telefoneMessageProvider;
  console.log('Não é necessário teste unitário para src/core/ports/index.ts: exporta apenas contratos TypeScript.');
});
