import type { ExecutionContext } from '../../../core/context/execution.context.ts';
import { RespondAppointmentUseCase, type RespondAppointmentInput, type RespondAppointmentOutput } from '../../../core/entities/appointment/application/appointment.respond.ts';
import type { AppointmentRepositoryPort } from '../../../core/entities/appointment/appointment.repositories.ts';
import type { AppointmentStatusPolicy } from '../../../core/entities/appointment/policies/appointment.status.policy.ts';
import type { CustomerRepositoryPort } from '../../../core/entities/customer/customer.repositories.ts';
import type { ServiceRepositoryPort } from '../../../core/entities/service/service.repositories.ts';
import type { SubscriptionPaymentStatusPolicyPort } from '../../../core/entities/subscription/policies/subscription.payment.status.policy.ts';
import type { SubscriptionRepositoryPort } from '../../../core/entities/subscription/subscription.repositories.ts';
import type { VerificationConfig } from '../../../core/entities/verification/verification.credential.port.ts';
import type { VerificationRepositoryPort } from '../../../core/entities/verification/verification.repositories.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import type { AuditRepositoryPort } from '../../../core/entities/audit/audit.repositories.ts';
import { withDefaultInterceptors } from '../../modules/shared/default.interceptors.ts';

export type AppointmentApplication = Readonly<{
  respond: Handler<RespondAppointmentInput, RespondAppointmentOutput>;
}>;

export function createAppointmentApplication<
  AppointmentStatus,
  MembershipStatus,
  AppointmentExtra = unknown,
  MembershipExtra = unknown,
>(input: {
  executionContext: ExecutionContext;
  appointmentRepository:
    AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
  customerRepository: CustomerRepositoryPort<unknown, unknown>;
  serviceRepository: ServiceRepositoryPort<unknown, unknown>;
  subscriptionRepository: SubscriptionRepositoryPort<unknown, unknown>;
  subscriptionPaymentStatusPolicy:
    SubscriptionPaymentStatusPolicyPort<unknown, unknown>;
  appointmentStatusPolicy: AppointmentStatusPolicy<AppointmentStatus>;
  verificationRepository:
    VerificationRepositoryPort<MembershipStatus, MembershipExtra>;
  verification: VerificationConfig;
  auditRepository: AuditRepositoryPort;
}): AppointmentApplication {
  const useCase = new RespondAppointmentUseCase(input);
  return Object.freeze({
    respond: withDefaultInterceptors(useCase.execute.bind(useCase), {
      action: 'appointment:respond',
      executionContext: input.executionContext,
      auditRepository: input.auditRepository,
    }),
  });
}
