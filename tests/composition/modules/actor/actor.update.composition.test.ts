import assert from 'node:assert/strict';
import test from 'node:test';
import { composeActorUpdate } from '../../../../src/composition/modules/actor/actor.update.composition.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import {
  actorCompositionInput,
  actorFixture,
} from './actor.composition.support.ts';

test('Monta e executa o update de actor', async () => {
  const repository = new ActorRepositoryMock();
  const actor = actorFixture();
  const updated = { ...actor, name: 'Marco Aurelio' };
  await repository.save(actor);

  await composeActorUpdate(actorCompositionInput(repository))(updated);

  assert.equal(await repository.findById(actor.id), updated);
});
