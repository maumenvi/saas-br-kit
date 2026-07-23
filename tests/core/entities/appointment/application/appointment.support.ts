import { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import type { Appointment } from '../../../../../src/core/entities/appointment/appointment.ts';
import type { Customer } from '../../../../../src/core/entities/customer/customer.ts';
import type { Plan } from '../../../../../src/core/entities/plan/plan.ts';
import type { Service } from '../../../../../src/core/entities/service/service.ts';
import type { Subscription } from '../../../../../src/core/entities/subscription/subscription.ts';
import { AppointmentRepositoryMock } from '../../../../../src/mocks/appointment.repository.ts';
import { CustomerRepositoryMock } from '../../../../../src/mocks/customer.repository.ts';
import { DatabaseMock } from '../../../../../src/mocks/database.ts';
import { LoggerMock } from '../../../../../src/mocks/logger.ts';
import { PasswordHashMock } from '../../../../../src/mocks/password.hash.ts';
import { PlanRepositoryMock } from '../../../../../src/mocks/plan.repository.ts';
import { ServiceRepositoryMock } from '../../../../../src/mocks/service.repository.ts';
import { PolicyAppointment, PolicySubscriptionPayment, type Status } from '../../../../../src/mocks/status.ts';
import { SubscriptionRepositoryMock } from '../../../../../src/mocks/subscription.repository.ts';

export const now = new Date('2026-07-23T12:00:00.000Z');
export const start = new Date('2026-07-24T12:00:00.000Z');

export const service = Object.freeze({
  id: 'service-1',
  organizationId: 'organization-1',
  name: 'Corte',
  description: 'Corte de cabelo',
  price: 5000,
  durationMinutes: 60,
  includedServiceIds: [],
  status: 'active',
  createdAt: now,
  updatedAt: now,
}) satisfies Service<Status>;

export const customer = Object.freeze({
  id: 'customer-1',
  organizationId: 'organization-1',
  name: 'Cliente',
  email: 'cliente@example.com',
  telephone: '+5511999999999',
  status: 'active',
  createdAt: now,
  updatedAt: now,
}) satisfies Customer<Status>;

export const plan = Object.freeze({
  id: 'plan-1',
  organizationId: 'organization-1',
  name: 'Mensal',
  price: 10000,
  services: [{ serviceId: service.id, quantity: 2 }],
  status: 'active',
  createdAt: now,
  updatedAt: now,
}) satisfies Plan<Status>;

export const subscription = Object.freeze({
  id: 'subscription-1',
  organizationId: 'organization-1',
  customerId: customer.id,
  planId: plan.id,
  price: plan.price,
  usedServices: [{ serviceId: service.id, quantity: 2, used: 0 }],
  recurrenceDays: 30,
  lastPayment: now,
  nextPayment: new Date('2026-08-22T12:00:00.000Z'),
  paymentProvider: 'local',
  status: 'active',
  createdAt: now,
  updatedAt: now,
}) satisfies Subscription<Status>;

export const appointment = Object.freeze({
  id: 'appointment-1',
  organizationId: 'organization-1',
  customerId: customer.id,
  serviceIds: [service.id],
  datetimeInitial: start,
  datetimeFinal: new Date('2026-07-24T13:00:00.000Z'),
  paymentType: 'subscription',
  paymentProvider: 'local',
  isPlanService: true,
  subscriptionId: subscription.id,
  status: 'active',
  createdAt: now,
  updatedAt: now,
}) satisfies Appointment<Status>;

export function setup() {
  const appointmentRepository = new AppointmentRepositoryMock();
  const customerRepository = new CustomerRepositoryMock();
  const serviceRepository = new ServiceRepositoryMock();
  const subscriptionRepository = new SubscriptionRepositoryMock();
  const planRepository = new PlanRepositoryMock();
  customerRepository.customers.push(customer);
  serviceRepository.services.push(service);
  subscriptionRepository.subscriptions.push(subscription);
  planRepository.plans.push(plan);
  const executionContext = new ExecutionContext({
    databaseProvider: new DatabaseMock(),
    loggerProvider: new LoggerMock(),
    passwordHashProvider: new PasswordHashMock(),
    clock: () => now,
  });
  return {
    executionContext,
    appointmentRepository,
    customerRepository,
    serviceRepository,
    subscriptionRepository,
    planRepository,
    paymentPolicy: new PolicySubscriptionPayment(),
    appointmentStatusPolicy: new PolicyAppointment(),
  };
}
