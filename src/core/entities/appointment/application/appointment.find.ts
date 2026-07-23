import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import type { Appointment } from '../appointment.ts';

export class FindAppointmentByIdUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository: AppointmentRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    appointmentRepository: AppointmentRepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.appointmentRepository = appointmentRepository;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Appointment<Status, Extra> | null> {
    return await this.executionContext.databaseProvider.run(async () => {
      const appointment = await this.appointmentRepository.findById(id);
      return appointment?.organizationId === organizationId
        ? appointment
        : null;
    });
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<Appointment<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () =>
      this.appointmentRepository.findByOrganizationId(organizationId)
    );
  }

  async findByDatetime(
    organizationId: string,
    datetimeInitial: Date,
    datetimeFinal: Date,
  ): Promise<Appointment<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () =>
      this.appointmentRepository.findByDatetime(
        organizationId,
        datetimeInitial,
        datetimeFinal,
      )
    );
  }

  async findByCustomerId(
    organizationId: string,
    customerId: string,
  ): Promise<Appointment<Status, Extra>[]> {
    return await this.executionContext.databaseProvider.run(async () =>
      this.appointmentRepository.findByCustomerId(organizationId, customerId)
    );
  }
}
