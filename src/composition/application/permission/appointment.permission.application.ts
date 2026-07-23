import type { PermissionContext } from '../../../core/access-control/permission.intercept.ts';
import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import { CancelAppointmentByActorUseCase, type CancelAppointmentByActorInput } from '../../../core/entities/appointment/application/appointment.cancel.ts';
import { ChangeAppointmentStatusUseCase } from '../../../core/entities/appointment/application/appointment.change.status.ts';
import { CreateAppointmentUseCase } from '../../../core/entities/appointment/application/appointment.create.ts';
import { FindAppointmentByIdUseCase } from '../../../core/entities/appointment/application/appointment.find.ts';
import { AppointmentNotificationUseCase, type AppointmentNotificationInput, type AppointmentResponseNotificationInput } from '../../../core/entities/appointment/application/appointment.notification.ts';
import { RequestAppointmentResponseVerificationUseCase, type RequestAppointmentResponseVerificationInput } from '../../../core/entities/appointment/application/appointment.response.request.ts';
import { UpdateAppointmentUseCase } from '../../../core/entities/appointment/application/appointment.update.ts';
import type { Appointment } from '../../../core/entities/appointment/appointment.ts';
import type { CreateAppointmentInput, UpdateAppointmentInput } from '../../../core/entities/appointment/application/appointment.input.ts';
import type { AppointmentRepositoryPort } from '../../../core/entities/appointment/appointment.repositories.ts';
import type { AppointmentStatusPolicy } from '../../../core/entities/appointment/policies/appointment.status.policy.ts';
import type { CustomerRepositoryPort } from '../../../core/entities/customer/customer.repositories.ts';
import type { ServiceRepositoryPort } from '../../../core/entities/service/service.repositories.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../../core/entities/subscription/policies/subscription.payment.status.policy.ts';
import type { SubscriptionRepositoryPort } from '../../../core/entities/subscription/subscription.repositories.ts';
import type { RequestVerificationOutput } from '../../../core/entities/verification/application/verification.request.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../../modules/shared/default.interceptors.ts';
import { assertOrganizationScope } from '../../../core/access-control/organization.scope.ts';

export type AppointmentDatetimeQuery = Readonly<{
  organizationId: string;
  datetimeInitial: Date;
  datetimeFinal: Date;
}>;

export type AppointmentCustomerQuery = Readonly<{
  organizationId: string;
  customerId: string;
}>;
export type AppointmentIdQuery = Readonly<{
  organizationId: string;
  id: string;
}>;

export type AppointmentPermissionApplication<
  AppointmentStatus,
  MembershipStatus,
  AppointmentExtra = unknown,
  MembershipExtra = unknown,
> = Readonly<{
  create: Handler<CreateAppointmentInput<AppointmentStatus, AppointmentExtra>, void>;
  update: Handler<UpdateAppointmentInput<AppointmentStatus, AppointmentExtra>, void>;
  changeStatus: Handler<Appointment<AppointmentStatus, AppointmentExtra>, void>;
  cancel: Handler<CancelAppointmentByActorInput, void>;
  requestResponse:
    Handler<RequestAppointmentResponseVerificationInput, RequestVerificationOutput>;
  sendEmail: Handler<AppointmentNotificationInput, void>;
  sendTelephone: Handler<AppointmentNotificationInput, void>;
  sendResponseEmail: Handler<AppointmentResponseNotificationInput, void>;
  sendResponseTelephone: Handler<AppointmentResponseNotificationInput, void>;
  findById:
    Handler<AppointmentIdQuery, Appointment<AppointmentStatus, AppointmentExtra> | null>;
  findByOrganizationId:
    Handler<string, Appointment<AppointmentStatus, AppointmentExtra>[]>;
  findByDatetime:
    Handler<AppointmentDatetimeQuery, Appointment<AppointmentStatus, AppointmentExtra>[]>;
  findByCustomerId:
    Handler<AppointmentCustomerQuery, Appointment<AppointmentStatus, AppointmentExtra>[]>;
}>;

export function createAppointmentPermissionApplication<
  AppointmentStatus,
  CustomerStatus,
  MembershipStatus,
  AppointmentExtra = unknown,
  CustomerExtra = unknown,
  MembershipExtra = unknown,
>(
  input: {
    executionContext: ExecutionContext;
    auditRepository: AuditRepositoryPort;
    appointmentRepository:
      AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
    customerRepository: CustomerRepositoryPort<CustomerStatus, CustomerExtra>;
    serviceRepository: ServiceRepositoryPort<unknown, unknown>;
    subscriptionRepository: SubscriptionRepositoryPort<unknown, unknown>;
    verificationRepository:
      VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
    subscriptionPaymentStatusPolicy:
      SubscriptionPaymentStatusPolicyPort<unknown, unknown>;
    appointmentStatusPolicy: AppointmentStatusPolicy<AppointmentStatus>;
    verification: VerificationConfig;
    permissionContext: PermissionContext;
  },
): AppointmentPermissionApplication<
  AppointmentStatus,
  MembershipStatus,
  AppointmentExtra,
  MembershipExtra
> {
  const dependencies = [
    input.executionContext,
    input.appointmentRepository,
    input.customerRepository,
    input.serviceRepository,
    input.subscriptionRepository,
    input.subscriptionPaymentStatusPolicy,
    input.appointmentStatusPolicy,
  ] as const;
  const create = new CreateAppointmentUseCase(...dependencies);
  const update = new UpdateAppointmentUseCase(...dependencies);
  const cancel = new CancelAppointmentByActorUseCase(...dependencies);
  const changeStatus = new ChangeAppointmentStatusUseCase(
    input.executionContext,
    input.appointmentRepository,
    input.appointmentStatusPolicy,
  );
  const find = new FindAppointmentByIdUseCase(
    input.executionContext,
    input.appointmentRepository,
  );
  const notification = new AppointmentNotificationUseCase(
    input.executionContext,
    input.appointmentRepository,
    input.customerRepository,
    input.verificationRepository,
    input.verification,
  );
  const requestResponse =
    new RequestAppointmentResponseVerificationUseCase({
      executionContext: input.executionContext,
      appointmentRepository: input.appointmentRepository,
      appointmentStatusPolicy: input.appointmentStatusPolicy,
      verificationRepository: input.verificationRepository,
      verification: input.verification,
    });
  const wrap = <I, O>(
    handler: Handler<I, O>,
    action: string,
    permission: 'appointment:create' | 'appointment:update' |
      'appointment:change-status' | 'appointment:find' | 'appointment:cancel',
    organizationId: (request: I) => string,
    idempotent = true,
  ) => withDefaultInterceptors<I, O>(
    async (request: I): Promise<O> => {
      assertOrganizationScope(input.permissionContext, organizationId(request));
      return await handler(request);
    },
    { ...input, action, permission, idempotent },
  );

  return Object.freeze({
    create: wrap(create.execute.bind(create), 'appointment:create', 'appointment:create', value => value.organizationId),
    update: wrap(update.update.bind(update), 'appointment:update', 'appointment:update', value => value.organizationId),
    changeStatus: wrap(
      changeStatus.changeStatus.bind(changeStatus),
      'appointment:change-status',
      'appointment:change-status',
      value => value.organizationId,
    ),
    cancel: wrap(cancel.execute.bind(cancel), 'appointment:cancel', 'appointment:cancel', value => value.organizationId),
    requestResponse: wrap(
      requestResponse.execute.bind(requestResponse),
      'appointment:request-response',
      'appointment:update',
      value => value.organizationId,
      false,
    ),
    sendEmail: wrap(
      notification.sendEmail.bind(notification),
      'appointment:send-email',
      'appointment:update',
      value => value.organizationId,
      false,
    ),
    sendTelephone: wrap(
      notification.sendTelephone.bind(notification),
      'appointment:send-telephone',
      'appointment:update',
      value => value.organizationId,
      false,
    ),
    sendResponseEmail: wrap(
      notification.sendResponseEmail.bind(notification),
      'appointment:send-response-email',
      'appointment:update',
      value => value.organizationId,
      false,
    ),
    sendResponseTelephone: wrap(
      notification.sendResponseTelephone.bind(notification),
      'appointment:send-response-telephone',
      'appointment:update',
      value => value.organizationId,
      false,
    ),
    findById: wrap(
      (query: AppointmentIdQuery) => find.findById(query.organizationId, query.id),
      'appointment:find-by-id',
      'appointment:find',
      (query: AppointmentIdQuery) => query.organizationId,
    ),
    findByOrganizationId: wrap(
      find.findByOrganizationId.bind(find),
      'appointment:find-by-organization',
      'appointment:find',
      (organizationId: string) => organizationId,
    ),
    findByDatetime: wrap(
      (query: AppointmentDatetimeQuery) => find.findByDatetime(
        query.organizationId,
        query.datetimeInitial,
        query.datetimeFinal,
      ),
      'appointment:find-by-datetime',
      'appointment:find',
      (query: AppointmentDatetimeQuery) => query.organizationId,
    ),
    findByCustomerId: wrap(
      (query: AppointmentCustomerQuery) =>
        find.findByCustomerId(query.organizationId, query.customerId),
      'appointment:find-by-customer',
      'appointment:find',
      (query: AppointmentCustomerQuery) => query.organizationId,
    ),
  });
}
