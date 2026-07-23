import type { ExecutionContext } from '../../../context/execution.context.ts';
import {
  RequestVerificationUseCase,
  type RequestVerificationOutput,
} from '../../verification/application/verification.request.ts';
import { VerificationErrors } from '../../verification/domain/verification.errors.ts';
import type { VerificationConfig } from '../../verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../verification/verification.repositories.ts';
import type { ActorRepositoryPort } from '../actor.repositories.ts';
import type { UserActor } from '../actor.ts';
import { ActorErrors } from '../domain/actor.errors.ts';

export type ActorVerificationInput = Readonly<{ actorId: string }>;

export type ActorVerificationUseCaseInput<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorStatus, ActorExtra>;
  verificationRepository: VerificationRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;
  config: VerificationConfig;
};

export class ActorVerificationUseCase<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> {
  private readonly input: ActorVerificationUseCaseInput<
    ActorStatus,
    MembershipStatus,
    ActorExtra,
    MembershipExtra
  >;
  private readonly requestVerification: RequestVerificationUseCase<
    MembershipStatus,
    MembershipExtra
  >;

  constructor(
    input: ActorVerificationUseCaseInput<
      ActorStatus,
      MembershipStatus,
      ActorExtra,
      MembershipExtra
    >,
  ) {
    this.input = input;
    this.requestVerification = new RequestVerificationUseCase(input);
  }

  async requestEmailConfirmation(
    request: ActorVerificationInput,
  ): Promise<RequestVerificationOutput> {
    const actor = await this.findUserActor(request.actorId);
    actor.email.validate();
    if (actor.emailVerified) {
      throw VerificationErrors.contactAlreadyVerified(
        actor.id,
        'EMAIL_CONFIRMATION',
      );
    }
    return await this.requestVerification.execute({
      purpose: 'EMAIL_CONFIRMATION',
      actorId: actor.id,
      destination: actor.email.value,
    });
  }

  async requestTelephoneConfirmation(
    request: ActorVerificationInput,
  ): Promise<RequestVerificationOutput> {
    const actor = await this.findUserActor(request.actorId);
    actor.telephone.validate();
    if (actor.telephoneVerified) {
      throw VerificationErrors.contactAlreadyVerified(
        actor.id,
        'TELEPHONE_CONFIRMATION',
      );
    }
    return await this.requestVerification.execute({
      purpose: 'TELEPHONE_CONFIRMATION',
      actorId: actor.id,
      destination: actor.telephone.value,
    });
  }

  private async findUserActor(
    actorId: string,
  ): Promise<UserActor<ActorStatus, ActorExtra>> {
    return await this.input.executionContext.databaseProvider.run(async () => {
      const actor = await this.input.actorRepository.findById(actorId);
      if (!actor) throw ActorErrors.notFound(actorId);
      if (actor.type !== 'USER') {
        throw ActorErrors.notificationRequiresUser(actorId);
      }
      return actor;
    });
  }
}
