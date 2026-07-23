import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ChangePlanStatusUseCase } from '../../../../../src/core/entities/plan/application/plan.change.status.ts';
import type { PlanRepositoryPort } from '../../../../../src/core/entities/plan/plan.repositories.ts';
import type { Plan } from '../../../../../src/core/entities/plan/plan.ts';

test('ChangePlanStatusUseCase delega a operação ao repository', async () => {
  const plan = { id: 'plan-1', status: 'active' } as Plan<'active'>;
  let received: Plan<'active'> | undefined;
  const repository = {
    changeStatus: async (value: Plan<'active'>) => {
      received = value;
      
    },
  } as unknown as PlanRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new ChangePlanStatusUseCase(executionContext, repository);

  await useCase.changeStatus(plan);

  assert.equal(received, plan);
  
});
