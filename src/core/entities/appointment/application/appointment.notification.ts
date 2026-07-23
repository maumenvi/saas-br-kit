import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { SendEmailPort } from '../../../ports/send.email.port.ts';
import type { SendTelefoneMessagePort } from '../../../ports/send.telefone.message.port.ts';
import { Email } from '../../actor/domain/email.ts';
import { Telephone } from '../../actor/domain/telephone.ts';
import type { CustomerRepositoryPort } from '../../customer/customer.repositories.ts';
import { CustomerErrors } from '../../customer/domain/customer.errors.ts';
import type { AppointmentRepositoryPort } from '../appointment.repositories.ts';
import { AppointmentErrors } from '../domain/appointment.errors.ts';
import type { VerificationRepositoryPort } from '../../verification/verification.repositories.ts';
import type { VerificationConfig } from '../../verification/verification.credential.port.ts';
import { VerificationErrors } from '../../verification/domain/verification.errors.ts';

export type AppointmentNotificationInput = Readonly<{
  appointmentId: string;
  organizationId: string;
}>;

export type AppointmentResponseNotificationInput =
  AppointmentNotificationInput & Readonly<{
    verificationId: string;
    credential: string;
    expiresAt: Date;
  }>;

export class AppointmentNotificationUseCase<
  AppointmentStatus,
  CustomerStatus,
  AppointmentExtra = unknown,
  CustomerExtra = unknown,
> {
  private readonly executionContext: ExecutionContext;
  private readonly appointmentRepository:
    AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>;
  private readonly customerRepository:
    CustomerRepositoryPort<CustomerStatus, CustomerExtra>;
  private readonly verificationRepository:
    VerificationRepositoryPort<unknown, unknown>;
  private readonly verification: VerificationConfig;

  constructor(
    executionContext: ExecutionContext,
    appointmentRepository:
      AppointmentRepositoryPort<AppointmentStatus, AppointmentExtra>,
    customerRepository: CustomerRepositoryPort<CustomerStatus, CustomerExtra>,
    verificationRepository: VerificationRepositoryPort<unknown, unknown>,
    verification: VerificationConfig,
  ) {
    this.executionContext = executionContext;
    this.appointmentRepository = appointmentRepository;
    this.customerRepository = customerRepository;
    this.verificationRepository = verificationRepository;
    this.verification = verification;
  }

  async sendEmail(input: AppointmentNotificationInput): Promise<void> {
    const provider = this.emailProvider();
    const { appointment, customer } = await this.load(input);
    new Email(customer.email).validate();
    await provider.sendEmail(Object.freeze({
      type: 'APPOINTMENT_NOTIFICATION',
      appointmentId: appointment.id,
      organizationId: appointment.organizationId,
      customerId: customer.id,
      name: customer.name,
      to: customer.email,
      serviceIds: [...appointment.serviceIds],
      datetimeInitial: appointment.datetimeInitial,
      datetimeFinal: appointment.datetimeFinal,
    }));
  }

  async sendTelephone(input: AppointmentNotificationInput): Promise<void> {
    const provider = this.telephoneProvider();
    const { appointment, customer } = await this.load(input);
    new Telephone(customer.telephone).validate();
    await provider.sendMessage(Object.freeze({
      type: 'APPOINTMENT_NOTIFICATION',
      appointmentId: appointment.id,
      organizationId: appointment.organizationId,
      customerId: customer.id,
      name: customer.name,
      to: customer.telephone,
      serviceIds: [...appointment.serviceIds],
      datetimeInitial: appointment.datetimeInitial,
      datetimeFinal: appointment.datetimeFinal,
    }));
  }

  async sendResponseEmail(
    input: AppointmentResponseNotificationInput,
  ): Promise<void> {
    const provider = this.emailProvider();
    const { appointment, customer } = await this.load(input);
    await this.validateResponse(input, appointment.id, customer.id);
    new Email(customer.email).validate();
    await provider.sendEmail(Object.freeze({
      type: 'APPOINTMENT_RESPONSE',
      appointmentId: appointment.id,
      organizationId: appointment.organizationId,
      customerId: customer.id,
      name: customer.name,
      to: customer.email,
      serviceIds: [...appointment.serviceIds],
      datetimeInitial: appointment.datetimeInitial,
      datetimeFinal: appointment.datetimeFinal,
      verificationId: input.verificationId,
      credential: input.credential,
      expiresAt: input.expiresAt,
    }));
  }

  async sendResponseTelephone(
    input: AppointmentResponseNotificationInput,
  ): Promise<void> {
    const provider = this.telephoneProvider();
    const { appointment, customer } = await this.load(input);
    await this.validateResponse(input, appointment.id, customer.id);
    new Telephone(customer.telephone).validate();
    await provider.sendMessage(Object.freeze({
      type: 'APPOINTMENT_RESPONSE',
      appointmentId: appointment.id,
      organizationId: appointment.organizationId,
      customerId: customer.id,
      name: customer.name,
      to: customer.telephone,
      serviceIds: [...appointment.serviceIds],
      datetimeInitial: appointment.datetimeInitial,
      datetimeFinal: appointment.datetimeFinal,
      verificationId: input.verificationId,
      credential: input.credential,
      expiresAt: input.expiresAt,
    }));
  }

  private async load(input: AppointmentNotificationInput) {
    return await this.executionContext.databaseProvider.run(async () => {
      const appointment = await this.appointmentRepository.findById(
        input.appointmentId,
      );
      if (!appointment) throw AppointmentErrors.notFound(input.appointmentId);
      if (appointment.organizationId !== input.organizationId) {
        throw AppointmentErrors.tenantMismatch(input.appointmentId);
      }
      const customer = await this.customerRepository.findById(
        appointment.customerId,
      );
      if (!customer) throw CustomerErrors.notFound(appointment.customerId);
      if (customer.organizationId !== input.organizationId) {
        throw CustomerErrors.crossOrganizationReference(customer.id);
      }
      return { appointment, customer };
    });
  }

  private emailProvider(): SendEmailPort {
    const provider = this.executionContext.sendEmailPort;
    if (!provider) throw CustomerErrors.emailProviderNotConfigured();
    return provider;
  }

  private async validateResponse(
    input: AppointmentResponseNotificationInput,
    appointmentId: string,
    customerId: string,
  ): Promise<void> {
    const verification = await this.executionContext.databaseProvider.run(
      async () => this.verificationRepository.findById(input.verificationId),
    );
    if (!verification) {
      throw VerificationErrors.notFound(input.verificationId);
    }
    if (
      verification.purpose !== 'APPOINTMENT_RESPONSE' ||
      verification.appointmentId !== appointmentId ||
      verification.customerId !== customerId ||
      verification.organizationId !== input.organizationId
    ) {
      throw VerificationErrors.invalidPurpose(verification.purpose);
    }
    if (
      verification.status !== 'PENDING' ||
      verification.expiresAt.getTime() !== input.expiresAt.getTime() ||
      this.executionContext.clock!().getTime() >=
        verification.expiresAt.getTime()
    ) {
      throw VerificationErrors.expired(verification.id);
    }
    const valid = await this.verification.credentialProvider.verify(
      input.credential,
      verification.credentialHash,
    );
    if (!valid) throw VerificationErrors.invalidCredential();
  }

  private telephoneProvider(): SendTelefoneMessagePort {
    const provider = this.executionContext.sendTelefoneMessagePort;
    if (!provider) throw CustomerErrors.telephoneProviderNotConfigured();
    return provider;
  }
}
