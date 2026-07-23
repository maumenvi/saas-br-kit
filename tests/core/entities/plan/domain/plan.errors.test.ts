import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAN_ERROR_CODE, PlanErrors } from '../../../../../src/core/entities/plan/domain/plan.errors.ts';

test('cria erros de plan', () => {
  assert.equal(PlanErrors.invalidQuantity('1').code, PLAN_ERROR_CODE.INVALID_QUANTITY);
});
