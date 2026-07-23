import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorRepositoryPort } from '../../actor/actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../../actor/policies/actor.status.police.ts';
import { MfaErrors } from '../domain/mfa.errors.ts';
import type { MfaProviderPort } from '../mfa.provider.port.ts';
import type { MfaRepositoryPort } from '../mfa.repositories.ts';
import type { Mfa } from '../mfa.ts';
import type {
  CreateMfaKeyInput,
  CreateMfaKeyOutput,
} from './mfa.create-key.input.ts';

export type CreateMfaKeyUseCaseInput<ActorStatus, ActorExtra = unknown> = {
  executionContext: ExecutionContext;
  actorRepository: Pick<
    ActorRepositoryPort<ActorStatus, ActorExtra>,
    'findById'
  >;
  actorStatusPolicy: ActorStatusPolicyPort<ActorStatus>;
  mfaRepository: MfaRepositoryPort;
  mfaProvider: MfaProviderPort;
};

export class CreateMfaKeyUseCase<ActorStatus, ActorExtra = unknown> {
  private readonly input: CreateMfaKeyUseCaseInput<ActorStatus, ActorExtra>;

  constructor(input: CreateMfaKeyUseCaseInput<ActorStatus, ActorExtra>) {
    this.input = input;
  }

  async execute(input: CreateMfaKeyInput): Promise<CreateMfaKeyOutput> {
    const actor = await this.input.actorRepository.findById(input.actorId);
    if (!actor) throw MfaErrors.actorNotFound(input.actorId);
    if (actor.type !== 'USER') throw MfaErrors.actorTypeNotAllowed(input.actorId);
    if (!this.input.actorStatusPolicy.isEnabled(actor.status)) {
      throw MfaErrors.actorNotEnabled(input.actorId);
    }

    await this.ensureNotConfigured(input.actorId);

    const key = await this.input.mfaProvider.createKey({
      issuer: input.issuer,
      label: actor.email.value,
    });
    const now = this.now();
    const mfa: Mfa = Object.freeze({
      id: this.generateId(),
      actorId: actor.id,
      method: 'TOTP',
      status: 'PENDING',
      providerCredential: key.providerCredential,
      lastUsedCounter: null,
      createdAt: now,
      updatedAt: now,
      activatedAt: null,
    });

    await this.input.executionContext.databaseProvider.run(async () => {
      await this.ensureNotConfigured(input.actorId);
      await this.input.mfaRepository.save(mfa);
    });

    return Object.freeze({
      secret: key.secret,
      provisioningUri: key.provisioningUri,
    });
  }

  private async ensureNotConfigured(actorId: string): Promise<void> {
    const current = await this.input.mfaRepository.findByActorId(actorId);
    if (current && current.status !== 'DISABLED') {
      throw MfaErrors.alreadyConfigured(actorId);
    }
  }

  private now(): Date {
    return this.input.executionContext.clock?.() ?? new Date();
  }

  private generateId(): string {
    return this.input.executionContext.idGenerator?.() ?? crypto.randomUUID();
  }
}
