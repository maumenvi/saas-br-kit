import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeActorFindByEmail,
  composeActorFindById,
  composeActorFindByName,
  composeActorFindByTelephone,
} from '../../../../src/composition/modules/actor/actor.find.composition.ts';
import { ActorRepositoryMock } from '../../../../src/mocks/actor.repository.ts';
import {
  actorCompositionInput,
  actorFixture,
} from './actor.composition.support.ts';

test('Monta e executa as consultas de actor', async () => {
  const repository = new ActorRepositoryMock();
  const actor = actorFixture();
  const input = actorCompositionInput(repository);
  await repository.save(actor);

  assert.equal(await composeActorFindById(input)(actor.id), actor);
  if (actor.type !== 'USER') throw new Error('Expected USER actor fixture');
  assert.equal(await composeActorFindByEmail(input)(actor.email.value), actor);
  assert.equal(
    await composeActorFindByTelephone(input)(actor.telephone.value),
    actor,
  );
  assert.deepEqual(await composeActorFindByName(input)(actor.name), [actor]);
});
