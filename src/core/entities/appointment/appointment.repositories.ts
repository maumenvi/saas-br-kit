import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { Appointment } from './appointment.ts';

export interface AppointmentRepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<Appointment<Status, Extra>> {
  findByOrganizationId(
    organizationId: string,
  ): Promise<Appointment<Status, Extra>[]>;
  findByDatetime(
    organizationId: string,
    datetimeInitial: Date,
    datetimeFinal: Date,
  ): Promise<Appointment<Status, Extra>[]>;
  findByCustomerId(
    organizationId: string,
    customerId: string,
  ): Promise<Appointment<Status, Extra>[]>;
}
