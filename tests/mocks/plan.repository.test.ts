import assert from 'node:assert/strict';
import test from 'node:test';
import { PlanRepositoryMock } from '../../src/mocks/plan.repository.ts';
import { plan } from '../core/entities/appointment/application/appointment.support.ts';

test('encontra planos que contenham qualquer serviço', async () => {
  const repository = new PlanRepositoryMock();
  await repository.save(plan);
  assert.equal((await repository.findByOneOrMoreServices('organization-1', ['service-1'])).length, 1);
});
