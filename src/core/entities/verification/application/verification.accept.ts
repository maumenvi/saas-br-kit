import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ActorRepositoryPort } from '../../actor/actor.repositories.ts';
import { MembershipErrors } from '../../membership/domain/membership.errors.ts';
import type { MembershipRepositoryPort } from '../../membership/membership.repositories.ts';
import { VerificationErrors } from '../domain/verification.errors.ts';
import type { VerificationConfig } from '../verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../verification.repositories.ts';
import type {
  Verification,
  VerificationPurpose,
} from '../verification.ts';

export type AcceptVerificationInput = Readonly<{
  verificationId: string;
  credential: string;
}>;

export type AcceptVerificationOutput = Readonly<{
  accepted: true;
  verificationId: string;
  purpose: VerificationPurpose;
  actorId: string;
  organizationId: string | null;
  membershipId: string | null;
}>;

type AcceptanceOutcome =
  | { status: 'ACCEPTED'; output: AcceptVerificationOutput }
  | { status: 'EXPIRED' }
  | { status: 'REJECTED' }
  | { status: 'CONFLICT' };

export type AcceptVerificationUseCaseInput<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  actorRepository: ActorRepositoryPort<ActorStatus, ActorExtra>;
  membershipRepository: MembershipRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;
  verificationRepository: VerificationRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;
  config: VerificationConfig;
};

export class AcceptVerificationUseCase<
  ActorStatus,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
> {
  private readonly input: AcceptVerificationUseCaseInput<
    ActorStatus,
    MembershipStatus,
    ActorExtra,
    MembershipExtra
  >;

  constructor(
    input: AcceptVerificationUseCaseInput<
      ActorStatus,
      MembershipStatus,
      ActorExtra,
      MembershipExtra
    >,
  ) {
    this.input = input;
  }

  async execute(request: AcceptVerificationInput): Promise<AcceptVerificationOutput> {
    const verification = await this.find(request.verificationId);
    this.ensurePendingState(verification);

    if (this.isExpired(verification)) {
      await this.expire(verification.id);
      throw VerificationErrors.expired(verification.id);
    }

    const valid = await this.input.config.credentialProvider.verify(
      request.credential,
      verification.credentialHash,
    );
    if (!valid) {
      const attempt = await this.input.executionContext.databaseProvider.run(
        async () => await this.input.verificationRepository.registerFailedAttempt(
          verification.id,
          this.now(),
        ),
      );
      if (attempt?.rejected) {
        throw VerificationErrors.rejected(verification.id);
      }
      throw VerificationErrors.invalidCredential();
    }

    const outcome = await this.accept(verification.id);
    if (outcome.status === 'EXPIRED') {
      throw VerificationErrors.expired(verification.id);
    }
    if (outcome.status === 'REJECTED') {
      throw VerificationErrors.rejected(verification.id);
    }
    if (outcome.status === 'CONFLICT') {
      throw VerificationErrors.transitionConflict(verification.id);
    }
    return outcome.output;
  }

  private async find(
    verificationId: string,
  ): Promise<Verification<MembershipStatus, MembershipExtra>> {
    return await this.input.executionContext.databaseProvider.run(async () => {
      const verification = await this.input.verificationRepository.findById(
        verificationId,
      );
      if (!verification) throw VerificationErrors.notFound(verificationId);
      return verification;
    });
  }

  private ensurePendingState(
    verification: Verification<MembershipStatus, MembershipExtra>,
  ): void {
    if (verification.status === 'ACCEPTED') {
      throw VerificationErrors.alreadyAccepted(verification.id);
    }
    if (verification.status === 'EXPIRED') {
      throw VerificationErrors.expired(verification.id);
    }
    if (verification.status === 'REJECTED') {
      throw VerificationErrors.rejected(verification.id);
    }
  }

  private async accept(verificationId: string): Promise<AcceptanceOutcome> {
    return await this.input.executionContext.databaseProvider.run(async () => {
      const verification = await this.input.verificationRepository.findById(
        verificationId,
      );
      if (!verification) return { status: 'CONFLICT' };
      if (verification.status === 'EXPIRED' || this.isExpired(verification)) {
        await this.input.verificationRepository.expireIfPending(
          verification.id,
          this.now(),
        );
        return { status: 'EXPIRED' };
      }
      if (verification.status === 'REJECTED') return { status: 'REJECTED' };
      if (verification.status !== 'PENDING') return { status: 'CONFLICT' };

      const acceptedAt = this.now();
      const accepted = await this.input.verificationRepository.acceptIfPending(
        verification.id,
        acceptedAt,
      );
      if (!accepted) return { status: 'CONFLICT' };

      await this.applyEffect(verification, acceptedAt);
      return {
        status: 'ACCEPTED',
        output: this.output(verification),
      };
    });
  }

  private async applyEffect(
    verification: Verification<MembershipStatus, MembershipExtra>,
    acceptedAt: Date,
  ): Promise<void> {
    if (verification.purpose === 'EMAIL_CONFIRMATION') {
      const confirmed = await this.input.actorRepository.confirmEmail(
        verification.actorId,
        verification.destination,
        acceptedAt,
      );
      if (!confirmed) {
        throw VerificationErrors.contactChanged(
          verification.actorId,
          verification.purpose,
        );
      }
      return;
    }
    if (verification.purpose === 'TELEPHONE_CONFIRMATION') {
      const confirmed = await this.input.actorRepository.confirmTelephone(
        verification.actorId,
        verification.destination,
        acceptedAt,
      );
      if (!confirmed) {
        throw VerificationErrors.contactChanged(
          verification.actorId,
          verification.purpose,
        );
      }
      return;
    }

    const membership = verification.membership;
    const current = await this.input.membershipRepository.findByActorOrganizationId(
      membership.actorId,
      membership.organizationId,
    );
    if (current) {
      throw MembershipErrors.alreadyExists(
        membership.actorId,
        membership.organizationId,
      );
    }
    await this.input.membershipRepository.save(membership);
  }

  private output(
    verification: Verification<MembershipStatus, MembershipExtra>,
  ): AcceptVerificationOutput {
    return Object.freeze({
      accepted: true,
      verificationId: verification.id,
      purpose: verification.purpose,
      actorId: verification.actorId,
      organizationId: verification.organizationId,
      membershipId:
        verification.purpose === 'ORGANIZATION_INVITATION'
          ? verification.membership.id
          : null,
    });
  }

  private async expire(verificationId: string): Promise<void> {
    await this.input.executionContext.databaseProvider.run(async () => {
      await this.input.verificationRepository.expireIfPending(
        verificationId,
        this.now(),
      );
    });
  }

  private isExpired(
    verification: Verification<MembershipStatus, MembershipExtra>,
  ): boolean {
    return this.now().getTime() >= verification.expiresAt.getTime();
  }

  private now(): Date {
    return this.input.executionContext.clock?.() ?? new Date();
  }
}
