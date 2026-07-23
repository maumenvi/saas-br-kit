import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import type { Appointment } from '../appointment.ts';
import type { AppointmentStatusPolicy } from '../policies/appointment.status.policy.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';

export class ChangeAppointmentStatusUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository: AppointmentRepositoryPort<Status, Extra>;
  private readonly appointmentStatusPolicy: AppointmentStatusPolicy<Status>;

  constructor(
    executionContext: ExecutionContext,
    appointmentRepository: AppointmentRepositoryPort<Status, Extra>,
    appointmentStatusPolicy: AppointmentStatusPolicy<Status>,
  ) {
    this.executionContext = executionContext;
    this.appointmentRepository = appointmentRepository;
    this.appointmentStatusPolicy = appointmentStatusPolicy;
  }

  async changeStatus(appointment: Appointment<Status, Extra>): Promise<void> {
    if (this.appointmentStatusPolicy.isCancelled(appointment.status)) {
      throw AppointmentErrors.cancellationRequiresCancelUseCase();
    }
    await this.executionContext.databaseProvider.run(async () => {
      await this.appointmentRepository.changeStatus(appointment);
    });
  }
}
