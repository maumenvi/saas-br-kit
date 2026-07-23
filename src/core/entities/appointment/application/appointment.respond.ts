import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { VerificationConfig } from '../../verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../verification/verification.repositories.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import type { ServiceRepositoryPort } from '../../service/service.repositories.ts';
import type { SubscriptionRepositoryPort } from '../../subscription/subscription.repositories.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../subscription/policies/subscription.payment.status.policy.ts';
import type { AppointmentStatusPolicy } from '../policies/appointment.status.policy.ts';
import { VerificationErrors } from '../../verification/domain/verification.errors.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';
import { AppointmentSchedulingService } from './appointment.scheduling.ts';

export const APPOINTMENT_RESPONSE_ACTIONS = ['CONFIRM', 'CANCEL'] as const;
export type AppointmentResponseAction =
  (typeof APPOINTMENT_RESPONSE_ACTIONS)[number];

export type RespondAppointmentInput = Readonly<{
  verificationId: string;
  credential: string;
  action: AppointmentResponseAction;
}>;

export type RespondAppointmentOutput = Readonly<{
  appointmentId: string;
  action: AppointmentResponseAction;
  respondedAt: Date;
}>;

export class RespondAppointmentUseCase<
  AppointmentStatus,
  MembershipStatus,
  AppointmentExtra = unknown,
  MembershipExtra = unknown,
> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository:
    AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
  private readonly subscriptionRepository:
    SubscriptionRepositoryPort<unknown, unknown>;
  private readonly verificationRepository:
    VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
  private readonly verification: VerificationConfig;
  private readonly appointmentStatusPolicy:
    AppointmentStatusPolicy<AppointmentStatus>;
  private readonly scheduling: AppointmentSchedulingService<AppointmentStatus>;

  constructor(input: {
    executionContext: ExecutionContext;
    appointmentRepository:
      AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
    customerRepository: CustomerRepositoryPort<unknown, unknown>;
    serviceRepository: ServiceRepositoryPort<unknown, unknown>;
    subscriptionRepository: SubscriptionRepositoryPort<unknown, unknown>;
    subscriptionPaymentStatusPolicy:
      SubscriptionPaymentStatusPolicyPort<unknown, unknown>;
    appointmentStatusPolicy: AppointmentStatusPolicy<AppointmentStatus>;
    verificationRepository:
      VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
    verification: VerificationConfig;
  }) {
    this.executionContext = input.executionContext;
    this.appointmentRepository = input.appointmentRepository;
    this.subscriptionRepository = input.subscriptionRepository;
    this.verificationRepository = input.verificationRepository;
    this.verification = input.verification;
    this.appointmentStatusPolicy = input.appointmentStatusPolicy;
    this.scheduling = new AppointmentSchedulingService(input);
  }

  async execute(
    input: RespondAppointmentInput,
  ): Promise<RespondAppointmentOutput> {
    const verification = await this.executionContext.databaseProvider.run(
      async () => this.verificationRepository.findById(input.verificationId),
    );
    if (!verification) {
      throw VerificationErrors.notFound(input.verificationId);
    }
    if (verification.purpose !== 'APPOINTMENT_RESPONSE') {
      throw VerificationErrors.invalidPurpose(verification.purpose);
    }
    if (verification.status === 'ACCEPTED') {
      throw VerificationErrors.alreadyAccepted(verification.id);
    }
    if (verification.status === 'EXPIRED') {
      throw VerificationErrors.expired(verification.id);
    }
    if (verification.status === 'REJECTED') {
      throw VerificationErrors.rejected(verification.id);
    }
    if (this.isExpired(verification.expiresAt)) {
      await this.expire(verification.id);
      throw VerificationErrors.expired(verification.id);
    }
    const valid = await this.verification.credentialProvider.verify(
      input.credential,
      verification.credentialHash,
    );
    if (!valid) {
      const attempt = await this.executionContext.databaseProvider.run(
        async () => this.verificationRepository.registerFailedAttempt(
          verification.id,
          this.now(),
        ),
      );
      if (attempt?.rejected) {
        throw VerificationErrors.rejected(verification.id);
      }
      throw VerificationErrors.invalidCredential();
    }

    const result = await this.executionContext.databaseProvider.run(
      async () => {
        const currentVerification =
          await this.verificationRepository.findById(verification.id);
        if (
          !currentVerification ||
          currentVerification.purpose !== 'APPOINTMENT_RESPONSE' ||
          currentVerification.status !== 'PENDING'
        ) {
          throw VerificationErrors.transitionConflict(verification.id);
        }
        if (this.isExpired(currentVerification.expiresAt)) {
          await this.verificationRepository.expireIfPending(
            currentVerification.id,
            this.now(),
          );
          throw VerificationErrors.expired(currentVerification.id);
        }
        const appointment = await this.appointmentRepository.findById(
          currentVerification.appointmentId,
        );
        if (!appointment) {
          throw AppointmentErrors.notFound(
            currentVerification.appointmentId,
          );
        }
        if (
          appointment.organizationId !==
            currentVerification.organizationId ||
          appointment.customerId !== currentVerification.customerId
        ) {
          throw AppointmentErrors.tenantMismatch(appointment.id);
        }
        if (this.appointmentStatusPolicy.isCancelled(appointment.status)) {
          throw AppointmentErrors.alreadyCancelled(appointment.id);
        }
        const respondedAt = this.now();
        const accepted =
          await this.verificationRepository.acceptIfPending(
            currentVerification.id,
            respondedAt,
          );
        if (!accepted) {
          throw VerificationErrors.transitionConflict(
            currentVerification.id,
          );
        }
        if (input.action === 'CONFIRM') {
          const confirmed = Object.freeze({
            ...appointment,
            confirmedAt: respondedAt,
            updatedAt: respondedAt,
          });
          await this.appointmentRepository.update(confirmed);
          return { appointment: confirmed, respondedAt };
        }
        const refunded = await this.scheduling.refund(appointment);
        if (refunded) await this.subscriptionRepository.update(refunded);
        const cancelled = Object.freeze({
          ...appointment,
          status: this.appointmentStatusPolicy.cancelledByCustomerStatus,
          updatedAt: respondedAt,
        });
        await this.appointmentRepository.changeStatus(cancelled);
        return { appointment: cancelled, respondedAt };
      },
    );

    if (
      input.action === 'CANCEL' &&
      this.executionContext.calendarIntegrationPort
    ) {
      try {
        await this.executionContext.calendarIntegrationPort.cancelAppointment(
          this.scheduling.toCalendarInput(result.appointment),
        );
      } catch (error) {
        this.executionContext.loggerProvider.warn(
          'Appointment cancellation was persisted, but calendar integration failed.',
          error,
        );
      }
    }
    return Object.freeze({
      appointmentId: result.appointment.id,
      action: input.action,
      respondedAt: result.respondedAt,
    });
  }

  private async expire(verificationId: string): Promise<void> {
    await this.executionContext.databaseProvider.run(async () => {
      await this.verificationRepository.expireIfPending(
        verificationId,
        this.now(),
      );
    });
  }

  private isExpired(expiresAt: Date): boolean {
    return this.now().getTime() >= expiresAt.getTime();
  }

  private now(): Date {
    return this.executionContext.clock?.() ?? new Date();
  }
}
