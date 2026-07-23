import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChangePlanStatusUseCase,
  CreatePlanUseCase,
  FindPlanByIdUseCase,
  UpdatePlanUseCase,
  PlanErrors,
} from '../../../../src/core/entities/plan/index.ts';

test('Exporta os casos de uso do módulo Plan', () => {
  assert.equal(typeof ChangePlanStatusUseCase, 'function');
  assert.equal(typeof CreatePlanUseCase, 'function');
  assert.equal(typeof FindPlanByIdUseCase, 'function');
  assert.equal(typeof UpdatePlanUseCase, 'function');
  assert.equal(typeof PlanErrors.invalidPrice, 'function');
});
