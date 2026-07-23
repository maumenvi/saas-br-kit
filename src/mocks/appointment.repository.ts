import type { RepositoriesExtra } from '../core/context/app.context.ts';
import type { AppointmentRepositoryPort } from '../core/entities/appointment/appointment.repositories.ts';
import type { Appointment } from '../core/entities/appointment/appointment.ts';
import type { Status } from './status.ts';

export class AppointmentRepositoryMock implements AppointmentRepositoryPort<
  Status,
  RepositoriesExtra['appointments']
> {
  readonly appointments: Appointment<Status>[] = [];
  async save(entity: Appointment<Status>): Promise<void> { this.appointments.push(entity); }
  async update(entity: Appointment<Status>): Promise<void> { this.replace(entity); }
  async changeStatus(entity: Appointment<Status>): Promise<void> { this.replace(entity); }
  async findById(id: string): Promise<Appointment<Status> | null> {
    return this.appointments.find(item => item.id === id) ?? null;
  }
  async findByOrganizationId(organizationId: string): Promise<Appointment<Status>[]> {
    return this.appointments.filter(item => item.organizationId === organizationId);
  }
  async findByDatetime(
    organizationId: string,
    datetimeInitial: Date,
    datetimeFinal: Date,
  ): Promise<Appointment<Status>[]> {
    return this.appointments.filter(item =>
      item.organizationId === organizationId &&
      item.datetimeInitial.getTime() < datetimeFinal.getTime() &&
      item.datetimeFinal.getTime() > datetimeInitial.getTime()
    );
  }
  async findByCustomerId(
    organizationId: string,
    customerId: string,
  ): Promise<Appointment<Status>[]> {
    return this.appointments.filter(item =>
      item.organizationId === organizationId && item.customerId === customerId
    );
  }
  private replace(entity: Appointment<Status>): void {
    const index = this.appointments.findIndex(item => item.id === entity.id);
    if (index >= 0) this.appointments[index] = entity;
  }
}
