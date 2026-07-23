import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import type { UpdateAppointmentInput } from './appointment.input.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import type { ServiceRepositoryPort } from '../../service/service.repositories.ts';
import type { SubscriptionRepositoryPort } from '../../subscription/subscription.repositories.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../subscription/policies/subscription.payment.status.policy.ts';
import type { AppointmentStatusPolicy } from '../policies/appointment.status.policy.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';
import { AppointmentSchedulingService } from './appointment.scheduling.ts';

export class UpdateAppointmentUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository:
    AppointmentRepositoryPort<Status, Extra>;
  private readonly subscriptionRepository:
    SubscriptionRepositoryPort<unknown, unknown>;
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
    this.scheduling = new AppointmentSchedulingService({
      appointmentRepository,
      customerRepository,
      serviceRepository,
      subscriptionRepository,
      subscriptionPaymentStatusPolicy,
      appointmentStatusPolicy,
    });
  }

  async update(input: UpdateAppointmentInput<Status, Extra>): Promise<void> {
    this.scheduling.validatePlanSelection(input);
    const appointment = await this.executionContext.databaseProvider.run(
      async () => {
        const current = await this.appointmentRepository.findById(input.id);
        if (!current) throw AppointmentErrors.notFound(input.id);
        if (current.organizationId !== input.organizationId) {
          throw AppointmentErrors.tenantMismatch(input.id);
        }
        const refunded = await this.scheduling.refund(current);
        if (refunded) await this.subscriptionRepository.update(refunded);
        const prepared = await this.scheduling.prepare(
          input,
          this.executionContext.clock!(),
          input.id,
        );
        if (prepared.subscription) {
          await this.subscriptionRepository.update(prepared.subscription);
        }
        const appointment = prepared.appointment as
          Parameters<typeof this.appointmentRepository.update>[0];
        await this.appointmentRepository.update(appointment);
        return prepared.appointment;
      },
    );
    if (!this.executionContext.calendarIntegrationPort) return;
    try {
      await this.executionContext.calendarIntegrationPort.upsertAppointment(
        this.scheduling.toCalendarInput(appointment),
      );
    } catch (error) {
      this.executionContext.loggerProvider.warn(
        'Appointment was persisted, but calendar integration failed.',
        error,
      );
    }
  }
}
