import type { Appointment } from '../appointment.ts';
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from './appointment.input.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import type { AppointmentStatusPolicy } from '../policies/appointment.status.policy.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import type { ServiceRepositoryPort } from '../../service/service.repositories.ts';
import type { Service } from '../../service/service.ts';
import type { SubscriptionRepositoryPort } from '../../subscription/subscription.repositories.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../subscription/policies/subscription.payment.status.policy.ts';
import type { Subscription } from '../../subscription/subscription.ts';
import type { CalendarAppointmentInput } from '../../../ports/calendar.integration.port.ts';

type AppointmentWriteInput<Status, Extra> =
  | CreateAppointmentInput<Status, Extra>
  | UpdateAppointmentInput<Status, Extra>;

export type AppointmentSchedulingDependencies<AppointmentStatus> = Readonly<{
  appointmentRepository: AppointmentRepositoryPort<AppointmentStatus, unknown>;
  customerRepository: CustomerRepositoryPort<unknown, unknown>;
  serviceRepository: ServiceRepositoryPort<unknown, unknown>;
  subscriptionRepository: SubscriptionRepositoryPort<unknown, unknown>;
  subscriptionPaymentStatusPolicy:
    SubscriptionPaymentStatusPolicyPort<unknown, unknown>;
  appointmentStatusPolicy: AppointmentStatusPolicy<AppointmentStatus>;
}>;

export class AppointmentSchedulingService<AppointmentStatus> {
  private readonly dependencies:
    AppointmentSchedulingDependencies<AppointmentStatus>;

  constructor(dependencies: AppointmentSchedulingDependencies<AppointmentStatus>) {
    this.dependencies = dependencies;
  }

  validatePlanSelection(
    input: AppointmentWriteInput<AppointmentStatus, unknown>,
  ): void {
    if (input.isPlanService) {
      if (!input.subscriptionId) {
        throw AppointmentErrors.subscriptionRequired();
      }
      if (input.paymentType !== 'subscription') {
        throw AppointmentErrors.paymentTypeMustBeSubscription();
      }
      return;
    }
    if (input.subscriptionId) {
      throw AppointmentErrors.subscriptionForbidden();
    }
    if (input.paymentType === 'subscription') {
      throw AppointmentErrors.paymentTypeCannotBeSubscription();
    }
  }

  async prepare(
    input: AppointmentWriteInput<AppointmentStatus, unknown>,
    now: Date,
    ignoreAppointmentId?: string,
  ): Promise<{
    appointment: Appointment<AppointmentStatus, unknown>;
    subscription?: Subscription<unknown, unknown>;
  }> {
    const customer = await this.dependencies.customerRepository.findById(
      input.customerId,
    );
    if (!customer) throw AppointmentErrors.customerNotFound(input.customerId);
    if (customer.organizationId !== input.organizationId) {
      throw AppointmentErrors.tenantMismatch(input.customerId);
    }

    const services = await this.loadServices(input);
    const datetimeFinal = input.datetimeFinal ?? this.calculateFinal(
      input.datetimeInitial,
      services,
    );
    if (
      !Number.isFinite(input.datetimeInitial.getTime()) ||
      !Number.isFinite(datetimeFinal.getTime()) ||
      datetimeFinal.getTime() <= input.datetimeInitial.getTime()
    ) {
      throw AppointmentErrors.invalidDatetime();
    }
    await this.assertAvailable(
      input.organizationId,
      input.datetimeInitial,
      datetimeFinal,
      ignoreAppointmentId,
    );

    const appointment = Object.freeze({
      ...input,
      paymentProvider: input.paymentProvider ?? 'local',
      serviceIds: [...input.serviceIds],
      datetimeFinal: new Date(datetimeFinal),
    }) as Appointment<AppointmentStatus, unknown>;

    if (!appointment.isPlanService) return { appointment };
    const subscription = await this.consumeSubscription(appointment, now);
    return { appointment, subscription };
  }

  async refund(
    appointment: Appointment<AppointmentStatus, unknown>,
  ): Promise<Subscription<unknown, unknown> | undefined> {
    if (!appointment.isPlanService || !appointment.subscriptionId) {
      return undefined;
    }
    const subscription =
      await this.dependencies.subscriptionRepository.findById(
        appointment.subscriptionId,
      );
    if (!subscription) {
      throw AppointmentErrors.subscriptionNotFound(
        appointment.subscriptionId,
      );
    }
    this.validateSubscriptionOwnership(appointment, subscription);
    const counts = this.countServices(appointment.serviceIds);
    return Object.freeze({
      ...subscription,
      usedServices: subscription.usedServices.map(item => Object.freeze({
        ...item,
        used: Math.max(0, item.used - (counts.get(item.serviceId) ?? 0)),
      })),
    });
  }

  toCalendarInput(
    appointment: Appointment<AppointmentStatus, unknown>,
  ): CalendarAppointmentInput {
    return {
      appointmentId: appointment.id,
      organizationId: appointment.organizationId,
      customerId: appointment.customerId,
      serviceIds: [...appointment.serviceIds],
      datetimeInitial: new Date(appointment.datetimeInitial),
      datetimeFinal: new Date(appointment.datetimeFinal),
    };
  }

  private async loadServices(
    input: AppointmentWriteInput<AppointmentStatus, unknown>,
  ): Promise<Service<unknown, unknown>[]> {
    const services: Service<unknown, unknown>[] = [];
    for (const serviceId of input.serviceIds) {
      const service = await this.dependencies.serviceRepository.findById(
        serviceId,
      );
      if (!service) throw AppointmentErrors.serviceNotFound(serviceId);
      if (service.organizationId !== input.organizationId) {
        throw AppointmentErrors.tenantMismatch(serviceId);
      }
      services.push(service);
    }
    return services;
  }

  private calculateFinal(
    datetimeInitial: Date,
    services: Service<unknown, unknown>[],
  ): Date {
    const durationMinutes = services.reduce(
      (total, service) => total + service.durationMinutes,
      0,
    );
    return new Date(datetimeInitial.getTime() + durationMinutes * 60 * 1000);
  }

  private async assertAvailable(
    organizationId: string,
    datetimeInitial: Date,
    datetimeFinal: Date,
    ignoreAppointmentId?: string,
  ): Promise<void> {
    const matches = await this.dependencies.appointmentRepository.findByDatetime(
      organizationId,
      datetimeInitial,
      datetimeFinal,
    );
    const hasConflict = matches.some(appointment =>
      appointment.id !== ignoreAppointmentId &&
      !this.dependencies.appointmentStatusPolicy.isCancelled(
        appointment.status,
      ) &&
      appointment.datetimeInitial.getTime() < datetimeFinal.getTime() &&
      appointment.datetimeFinal.getTime() > datetimeInitial.getTime()
    );
    if (hasConflict) throw AppointmentErrors.datetimeUnavailable();
  }

  private async consumeSubscription(
    appointment: Appointment<AppointmentStatus, unknown>,
    now: Date,
  ): Promise<Subscription<unknown, unknown>> {
    const subscriptionId = appointment.subscriptionId;
    if (!subscriptionId) throw AppointmentErrors.subscriptionRequired();
    const subscription =
      await this.dependencies.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw AppointmentErrors.subscriptionNotFound(subscriptionId);
    }
    this.validateSubscriptionOwnership(appointment, subscription);
    if (
      !this.dependencies.subscriptionPaymentStatusPolicy.isPaymentCurrent(
        subscription,
        now,
      )
    ) {
      throw AppointmentErrors.subscriptionPaymentRequired(subscription.id);
    }
    const counts = this.countServices(appointment.serviceIds);
    for (const [serviceId, count] of counts) {
      const usage = subscription.usedServices.find(
        item => item.serviceId === serviceId,
      );
      if (!usage || usage.used + count > usage.quantity) {
        throw AppointmentErrors.subscriptionServiceUnavailable(serviceId);
      }
    }
    return Object.freeze({
      ...subscription,
      usedServices: subscription.usedServices.map(item => Object.freeze({
        ...item,
        used: item.used + (counts.get(item.serviceId) ?? 0),
      })),
    });
  }

  private validateSubscriptionOwnership(
    appointment: Appointment<AppointmentStatus, unknown>,
    subscription: Subscription<unknown, unknown>,
  ): void {
    if (
      subscription.organizationId !== appointment.organizationId ||
      subscription.customerId !== appointment.customerId
    ) {
      throw AppointmentErrors.tenantMismatch(subscription.id);
    }
  }

  private countServices(serviceIds: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const serviceId of serviceIds) {
      counts.set(serviceId, (counts.get(serviceId) ?? 0) + 1);
    }
    return counts;
  }
}
