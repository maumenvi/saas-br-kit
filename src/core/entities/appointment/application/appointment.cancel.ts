import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import type { ServiceRepositoryPort } from '../../service/service.repositories.ts';
import type { SubscriptionRepositoryPort } from '../../subscription/subscription.repositories.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../subscription/policies/subscription.payment.status.policy.ts';
import type { AppointmentStatusPolicy } from '../policies/appointment.status.policy.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';
import { AppointmentSchedulingService } from './appointment.scheduling.ts';

export type CancelAppointmentByActorInput = Readonly<{
  appointmentId: string;
  organizationId: string;
}>;

export class CancelAppointmentByActorUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository:
    AppointmentRepositoryPort<Status, Extra>;
  private readonly subscriptionRepository:
    SubscriptionRepositoryPort<unknown, unknown>;
  private readonly appointmentStatusPolicy:
    AppointmentStatusPolicy<Status>;
  private readonly scheduling: AppointmentSchedulingService<Status>;

  constructor(
    executionContext: ExecutionContext,
    appointmentRepository: AppointmentRepositoryPort<Status, Extra>,
    customerRepository: CustomerRepositoryPort<unknown, unknown>,
    serviceRepository: ServiceRepositoryPort<unknown, unknown>,
    subscriptionRepository: SubscriptionRepositoryPort<unknown, unknown>,
    subscriptionPaymentStatusPolicy:
      SubscriptionPaymentStatusPolicyPort<unknown, unknown>,
    appointmentStatusPolicy: AppointmentStatusPolicy<Status>,
  ) {
    this.executionContext = executionContext;
    this.appointmentRepository = appointmentRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.appointmentStatusPolicy = appointmentStatusPolicy;
    this.scheduling = new AppointmentSchedulingService({
      appointmentRepository,
      customerRepository,
      serviceRepository,
      subscriptionRepository,
      subscriptionPaymentStatusPolicy,
      appointmentStatusPolicy,
    });
  }

  async execute(input: CancelAppointmentByActorInput): Promise<void> {
    const appointment = await this.executionContext.databaseProvider.run(
      async () => {
        const current =
          await this.appointmentRepository.findById(input.appointmentId);
        if (!current) throw AppointmentErrors.notFound(input.appointmentId);
        if (current.organizationId !== input.organizationId) {
          throw AppointmentErrors.tenantMismatch(input.appointmentId);
        }
        if (this.appointmentStatusPolicy.isCancelled(current.status)) {
          throw AppointmentErrors.alreadyCancelled(current.id);
        }
        const refunded = await this.scheduling.refund(current);
        if (refunded) await this.subscriptionRepository.update(refunded);
        const cancelled = Object.freeze({
          ...current,
          status: this.appointmentStatusPolicy.cancelledByActorStatus,
          updatedAt: this.executionContext.clock!(),
        });
        await this.appointmentRepository.changeStatus(cancelled);
        return cancelled;
      },
    );
    if (!this.executionContext.calendarIntegrationPort) return;
    try {
      await this.executionContext.calendarIntegrationPort.cancelAppointment(
        this.scheduling.toCalendarInput(appointment),
      );
    } catch (error) {
      this.executionContext.loggerProvider.warn(
        'Appointment cancellation was persisted, but calendar integration failed.',
        error,
      );
    }
  }
}
