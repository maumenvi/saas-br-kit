import { MfaComposition } from '../../modules/mfa/mfa.composition.ts';
import type { MfaCompositionInput } from '../../modules/mfa/mfa.composition.input.ts';

export type MfaPermissionApplication<
  ActorStatus,
  ActorExtra = unknown,
> = Pick<
  MfaComposition<ActorStatus, ActorExtra>,
  'createKey' | 'validateCode'
>;

export function createMfaPermissionScope<
  ActorStatus,
  ActorExtra = unknown,
>(
  input: MfaCompositionInput<ActorStatus, ActorExtra>,
): MfaPermissionApplication<ActorStatus, ActorExtra> {
  const composition = new MfaComposition(input);

  return Object.freeze({
    createKey: composition.createKey,
    validateCode: composition.validateCode,
  });
}
