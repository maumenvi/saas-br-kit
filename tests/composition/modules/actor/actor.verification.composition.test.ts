import assert from 'node:assert/strict';
import test from 'node:test';
import { composeActorRequestEmailConfirmation } from '../../../../src/composition/modules/actor/actor.verification.composition.ts';
import {
  actorCompositionInput,
  actorFixture,
} from './actor.composition.support.ts';

test('Compõe solicitação de confirmação sem aplicar idempotência', async () => {
  const input = actorCompositionInput();
  const actor = actorFixture();
  assert.equal(actor.type, 'USER');
  if (actor.type !== 'USER') throw new Error('Expected USER fixture');
  await input.actorRepository.save({
    ...actor,
    emailVerified: false,
  });
  const output = await composeActorRequestEmailConfirmation(input)({ actorId: 'actor-1' });
  assert.equal(output.purpose, 'EMAIL_CONFIRMATION');
  assert.equal(
    (await input.verificationRepository.findById(output.verificationId))?.status,
    'PENDING',
  );
});
