import assert from 'node:assert/strict';
import test from 'node:test';
import { composeActorCreate } from '../../../../src/composition/modules/actor/actor.create.composition.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import {
  actorCompositionInput,
  actorFixture,
} from './actor.composition.support.ts';

test('Monta e executa o create de actor', async () => {
  const repository = new ActorRepositoryMock();
  const actor = actorFixture();

  await composeActorCreate(actorCompositionInput(repository))(actor);

  assert.equal(await repository.findById(actor.id), actor);
});
