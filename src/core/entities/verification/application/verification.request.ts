import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { Membership } from '../../membership/membership.ts';
import { VerificationErrors } from '../domain/verification.errors.ts';
import type { VerificationConfig } from '../verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../verification.repositories.ts';
import type {
  Verification,
  VerificationPurpose,
} from '../verification.ts';

export type RequestEmailConfirmationInput = Readonly<{
  purpose: 'EMAIL_CONFIRMATION';
  actorId: string;
  destination: string;
}>;

export type RequestTelephoneConfirmationInput = Readonly<{
  purpose: 'TELEPHONE_CONFIRMATION';
  actorId: string;
  destination: string;
}>;

export type RequestOrganizationInvitationInput<
  MembershipStatus,
  MembershipExtra = unknown,
> = Readonly<{
  purpose: 'ORGANIZATION_INVITATION';
  actorId: string;
  organizationId: string;
  destination: string;
  membership: Membership<MembershipStatus, MembershipExtra>;
}>;

export type RequestAppointmentResponseInput = Readonly<{
  purpose: 'APPOINTMENT_RESPONSE';
  organizationId: string;
  customerId: string;
  appointmentId: string;
  expiresAt: Date;
}>;

export type RequestVerificationInput<
  MembershipStatus,
  MembershipExtra = unknown,
> =
  | RequestEmailConfirmationInput
  | RequestTelephoneConfirmationInput
  | RequestOrganizationInvitationInput<MembershipStatus, MembershipExtra>
  | RequestAppointmentResponseInput;

export type RequestVerificationOutput = Readonly<{
  verificationId: string;
  purpose: VerificationPurpose;
  credential: string;
  expiresAt: Date;
}>;

export type RequestVerificationUseCaseInput<
  MembershipStatus,
  MembershipExtra = unknown,
> = {
  executionContext: ExecutionContext;
  verificationRepository: VerificationRepositoryPort<
    MembershipStatus,
    MembershipExtra
  >;
  config: VerificationConfig;
};

export class RequestVerificationUseCase<
  MembershipStatus,
  MembershipExtra = unknown,
> {
  private readonly input: RequestVerificationUseCaseInput<
    MembershipStatus,
    MembershipExtra
  >;

  constructor(
    input: RequestVerificationUseCaseInput<MembershipStatus, MembershipExtra>,
  ) {
    this.input = input;
  }

  async execute(
    request: RequestVerificationInput<MembershipStatus, MembershipExtra>,
  ): Promise<RequestVerificationOutput> {
    this.validateConfig(request.purpose);
    const credential = await this.input.config.credentialProvider.issue(
      request.purpose,
    );
    const now = this.now();
    const expiresAt = request.purpose === 'APPOINTMENT_RESPONSE'
      ? new Date(request.expiresAt)
      : new Date(now.getTime() + this.input.config.ttlMs[request.purpose]);
    if (expiresAt.getTime() <= now.getTime()) {
      throw VerificationErrors.invalidExpiration();
    }
    const verification = this.createVerification(
      request,
      credential.hash,
      now,
      expiresAt,
    );

    await this.input.executionContext.databaseProvider.run(async () => {
      await this.input.verificationRepository.expirePendingFor(
        {
          purpose: verification.purpose,
          actorId: verification.actorId,
          organizationId: verification.organizationId,
          ...(verification.purpose === 'APPOINTMENT_RESPONSE'
            ? { appointmentId: verification.appointmentId }
            : {}),
        },
        now,
      );
      await this.input.verificationRepository.save(verification);
    });

    return Object.freeze({
      verificationId: verification.id,
      purpose: verification.purpose,
      credential: credential.value,
      expiresAt,
    });
  }

  private createVerification(
    request: RequestVerificationInput<MembershipStatus, MembershipExtra>,
    credentialHash: string,
    now: Date,
    expiresAt: Date,
  ): Verification<MembershipStatus, MembershipExtra> {
    const base = {
      id: this.generateId(),
      credentialHash,
      status: 'PENDING' as const,
      attempts: 0,
      maxAttempts: this.input.config.maxAttempts,
      expiresAt,
      createdAt: now,
      acceptedAt: null,
      rejectedAt: null,
      expiredAt: null,
    };

    if (request.purpose === 'EMAIL_CONFIRMATION') {
      return Object.freeze({
        ...base,
        actorId: request.actorId,
        destination: request.destination,
        purpose: request.purpose,
        channel: 'EMAIL' as const,
        organizationId: null,
      });
    }
    if (request.purpose === 'TELEPHONE_CONFIRMATION') {
      return Object.freeze({
        ...base,
        actorId: request.actorId,
        destination: request.destination,
        purpose: request.purpose,
        channel: 'TELEPHONE' as const,
        organizationId: null,
      });
    }
    if (request.purpose === 'ORGANIZATION_INVITATION') {
      return Object.freeze({
        ...base,
        actorId: request.actorId,
        destination: request.destination,
        purpose: request.purpose,
        channel: 'EMAIL' as const,
        organizationId: request.organizationId,
        membership: Object.freeze({ ...request.membership }),
      });
    }
    return Object.freeze({
      ...base,
      actorId: null,
      destination: null,
      purpose: request.purpose,
      channel: null,
      organizationId: request.organizationId,
      customerId: request.customerId,
      appointmentId: request.appointmentId,
    });
  }

  private validateConfig(purpose: VerificationPurpose): void {
    if (
      purpose !== 'APPOINTMENT_RESPONSE' &&
      this.input.config.ttlMs[purpose] <= 0
    ) {
      throw VerificationErrors.invalidConfig(`ttlMs.${purpose}`);
    }
    if (this.input.config.maxAttempts <= 0) {
      throw VerificationErrors.invalidConfig('maxAttempts');
    }
  }

  private now(): Date {
    return this.input.executionContext.clock?.() ?? new Date();
  }

  private generateId(): string {
    return this.input.executionContext.idGenerator?.() ?? crypto.randomUUID();
  }
}
