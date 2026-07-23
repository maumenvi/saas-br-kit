import assert from 'node:assert/strict';
import test from 'node:test';
import { CreatePlanUseCase } from '../../../../../src/core/entities/plan/application/plan.create.ts';
import { setup, plan } from '../../appointment/application/appointment.support.ts';

test('cria plano quando os serviços pertencem à organização', async () => {
  const context = setup();
  const useCase = new CreatePlanUseCase(
    context.executionContext,
    context.planRepository,
    context.serviceRepository,
  );
  context.planRepository.plans.length = 0;

  await useCase.execute(plan);

  assert.deepEqual(context.planRepository.plans, [plan]);
});
