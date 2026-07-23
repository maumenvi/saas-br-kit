import {
  CreateMfaKeyUseCase,
} from '../../../core/entities/mfa/application/mfa.create-key.ts';
import type { CreateMfaKeyOutput } from '../../../core/entities/mfa/application/mfa.create-key.input.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MfaCompositionInput } from './mfa.composition.input.ts';

export function composeMfaCreateKey<ActorStatus, ActorExtra = unknown>(
  input: MfaCompositionInput<ActorStatus, ActorExtra>,
): Handler<void, CreateMfaKeyOutput> {
  const useCase = new CreateMfaKeyUseCase({
    executionContext: input.executionContext,
    actorRepository: input.actorRepository,
    actorStatusPolicy: input.actorStatusPolicy,
    mfaRepository: input.mfaRepository,
    mfaProvider: input.mfaProvider,
  });

  return withDefaultInterceptors(
    async () => await useCase.execute({
      actorId: input.permissionContext.actorId,
      issuer: input.issuer,
    }),
    {
      action: 'mfa:create-key',
      idempotent: false,
      ...input,
    },
  );
}
