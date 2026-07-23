import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { FindPlanByIdUseCase } from '../../../../../src/core/entities/plan/application/plan.find.ts';
import type { PlanRepositoryPort } from '../../../../../src/core/entities/plan/plan.repositories.ts';
import type { Plan } from '../../../../../src/core/entities/plan/plan.ts';

test('FindPlanByIdUseCase delega a operação ao repository', async () => {
  const plan = {
    id: 'plan-1',
    status: 'active',
    organizationId: 'organization-1',
  } as Plan<'active'>;
  let received: string | undefined;
  const repository = {
    findById: async (value: string) => {
      received = value;
      return plan;
    },
  } as unknown as PlanRepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new FindPlanByIdUseCase(executionContext, repository);

  const result = await useCase.findById('organization-1', plan.id);

  assert.equal(received, plan.id);
  assert.equal(result, plan);
});
