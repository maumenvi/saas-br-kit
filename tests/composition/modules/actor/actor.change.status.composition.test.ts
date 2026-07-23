import assert from 'node:assert/strict';
import test from 'node:test';
import { composeActorChangeStatus } from '../../../../src/composition/modules/actor/actor.change.status.composition.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import {
  actorCompositionInput,
  actorFixture,
} from './actor.composition.support.ts';

test('Monta e executa a mudança de status de actor', async () => {
  const repository = new ActorRepositoryMock();
  const actor = actorFixture();
  await repository.save(actor);

  await composeActorChangeStatus(actorCompositionInput(repository))(actor);

  assert.equal(repository.actors[0]?.status, 'inactive');
});
