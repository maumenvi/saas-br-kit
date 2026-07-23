import test from 'node:test';
import type { CreateSubscriptionInput } from '../../../../../src/core/entities/subscription/application/subscription.input.ts';

test('declara o input de criação de subscription', () => {
  const input = undefined as CreateSubscriptionInput<string> | undefined;
  void input;
});
