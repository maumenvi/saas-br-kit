import type { ExecutionContext } from '../../../context/execution.context.ts';
import { MfaErrors } from '../domain/mfa.errors.ts';
import type { MfaProviderPort } from '../mfa.provider.port.ts';
import type { MfaRepositoryPort } from '../mfa.repositories.ts';
import type {
  ValidateMfaCodeInput,
  ValidateMfaCodeOutput,
} from './mfa.validate-code.input.ts';

export type ValidateMfaCodeUseCaseInput = {
  executionContext: ExecutionContext;
  mfaRepository: MfaRepositoryPort;
  mfaProvider: MfaProviderPort;
};

export class ValidateMfaCodeUseCase {
  private readonly input: ValidateMfaCodeUseCaseInput;

  constructor(input: ValidateMfaCodeUseCaseInput) {
    this.input = input;
  }

  async execute(input: ValidateMfaCodeInput): Promise<ValidateMfaCodeOutput> {
    const mfa = await this.input.mfaRepository.findByActorId(input.actorId);
    if (!mfa) throw MfaErrors.notConfigured(input.actorId);
    if (mfa.status === 'DISABLED') throw MfaErrors.notActive(input.actorId);

    const validation = await this.input.mfaProvider.validateCode({
      providerCredential: mfa.providerCredential,
      code: input.code,
    });
    if (!validation.valid) throw MfaErrors.invalidCode();

    const activated = mfa.status === 'PENDING';
    await this.input.executionContext.databaseProvider.run(async () => {
      const accepted = activated
        ? await this.input.mfaRepository.activate(
          mfa.id,
          validation.counter,
          this.now(),
        )
        : await this.input.mfaRepository.consumeCounter(
          mfa.id,
          validation.counter,
          this.now(),
        );
      if (!accepted) throw MfaErrors.codeReused();
    });

    return Object.freeze({ valid: true, activated });
  }

  private now(): Date {
    return this.input.executionContext.clock?.() ?? new Date();
  }
}
