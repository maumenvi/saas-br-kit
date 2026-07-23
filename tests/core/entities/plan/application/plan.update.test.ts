import assert from 'node:assert/strict';
import test from 'node:test';
import { UpdatePlanUseCase } from '../../../../../src/core/entities/plan/application/plan.update.ts';
import { setup, plan } from '../../appointment/application/appointment.support.ts';

test('atualiza plano validando os serviços', async () => {
  const context = setup();
  const useCase = new UpdatePlanUseCase(
    context.executionContext,
    context.planRepository,
    context.serviceRepository,
  );

  await useCase.update({ ...plan, name: 'Novo nome' });

  assert.equal(context.planRepository.plans[0]?.name, 'Novo nome');
});
