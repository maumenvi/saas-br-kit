import test from 'node:test';
import type { PlanInput } from '../../../../../src/core/entities/plan/application/plan.input.ts';

test('declara o input de plan', () => {
  const input = undefined as PlanInput<string> | undefined;
  void input;
});
