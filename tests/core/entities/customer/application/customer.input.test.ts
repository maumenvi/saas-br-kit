import test from 'node:test';
import type { CustomerInput } from '../../../../../src/core/entities/customer/application/customer.input.ts';

test('declara o input de customer', () => {
  const input = undefined as CustomerInput<string> | undefined;
  void input;
});
