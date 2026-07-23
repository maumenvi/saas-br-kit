import test from 'node:test';
import type { SubscriptionPaymentStatusPolicyPort } from '../../../../../src/core/entities/subscription/policies/subscription.payment.status.policy.ts';

test('declara a policy de pagamento', () => {
  const policy = undefined as SubscriptionPaymentStatusPolicyPort<string> | undefined;
  void policy;
});
