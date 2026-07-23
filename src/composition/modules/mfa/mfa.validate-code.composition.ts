import type { ValidateMfaCodeOutput } from '../../../core/entities/mfa/application/mfa.validate-code.input.ts';
import { ValidateMfaCodeUseCase } from '../../../core/entities/mfa/application/mfa.validate-code.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { MfaCompositionInput } from './mfa.composition.input.ts';

export type ValidateOwnMfaCodeInput = Readonly<{
  code: string;
}>;

export function composeMfaValidateCode<ActorStatus, ActorExtra = unknown>(
  input: MfaCompositionInput<ActorStatus, ActorExtra>,
): Handler<ValidateOwnMfaCodeInput, ValidateMfaCodeOutput> {
  const useCase = new ValidateMfaCodeUseCase({
    executionContext: input.executionContext,
    mfaRepository: input.mfaRepository,
    mfaProvider: input.mfaProvider,
  });

  return withDefaultInterceptors(
    async ({ code }) => await useCase.execute({
      actorId: input.permissionContext.actorId,
      code,
    }),
    {
      action: 'mfa:validate-code',
      ...input,
    },
  );
}
