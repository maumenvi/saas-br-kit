import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { RequestVerificationOutput } from '../../verification/application/verification.request.ts';
import { RequestVerificationUseCase } from '../../verification/application/verification.request.ts';
import type { VerificationConfig } from '../../verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../verification/verification.repositories.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';
import type { AppointmentStatusPolicy } from '../policies/appointment.status.policy.ts';

export type RequestAppointmentResponseVerificationInput = Readonly<{
  appointmentId: string;
  organizationId: string;
}>;

export class RequestAppointmentResponseVerificationUseCase<
  AppointmentStatus,
  MembershipStatus,
  AppointmentExtra = unknown,
  MembershipExtra = unknown,
> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository:
    AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
  private readonly appointmentStatusPolicy:
    AppointmentStatusPolicy<AppointmentStatus>;
  private readonly requestVerification:
    RequestVerificationUseCase<MembershipStatus, MembershipExtra>;

  constructor(input: {
    executionContext: ExecutionContext;
    appointmentRepository:
      AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
    appointmentStatusPolicy: AppointmentStatusPolicy<AppointmentStatus>;
    verificationRepository:
      VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
    verification: VerificationConfig;
  }) {
    this.executionContext = input.executionContext;
    this.appointmentRepository = input.appointmentRepository;
    this.appointmentStatusPolicy = input.appointmentStatusPolicy;
    this.requestVerification = new RequestVerificationUseCase({
      executionContext: input.executionContext,
      verificationRepository: input.verificationRepository,
      config: input.verification,
    });
  }

  async execute(
    input: RequestAppointmentResponseVerificationInput,
  ): Promise<RequestVerificationOutput> {
    const appointment = await this.executionContext.databaseProvider.run(
      async () => this.appointmentRepository.findById(input.appointmentId),
    );
    if (!appointment) throw AppointmentErrors.notFound(input.appointmentId);
    if (appointment.organizationId !== input.organizationId) {
      throw AppointmentErrors.tenantMismatch(input.appointmentId);
    }
    if (this.appointmentStatusPolicy.isCancelled(appointment.status)) {
      throw AppointmentErrors.alreadyCancelled(appointment.id);
    }
    return await this.requestVerification.execute({
      purpose: 'APPOINTMENT_RESPONSE',
      organizationId: appointment.organizationId,
      customerId: appointment.customerId,
      appointmentId: appointment.id,
      expiresAt: new Date(
        appointment.datetimeInitial.getTime() - 2 * 60 * 60 * 1000,
      ),
    });
  }
}
