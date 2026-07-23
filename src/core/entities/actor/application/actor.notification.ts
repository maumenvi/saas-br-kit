import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { SendEmailPort } from '../../../ports/send.email.port.ts';
import type { SendTelefoneMessagePort } from '../../../ports/send.telefone.message.port.ts';
import type { ActorRepositoryPort } from '../actor.repositories.ts';
import type { UserActor } from '../actor.ts';
import { ActorErrors } from '../domain/actor.errors.ts';

export type ActorNotificationInput = Readonly<{
  actorId: string;
}>;

export type ActorOrganizationNotificationInput = ActorNotificationInput & Readonly<{
  organizationId: string;
}>;

export type VerificationNotificationInput = Readonly<{
  verificationId: string;
  credential: string;
  expiresAt: Date;
}>;

export type ActorVerificationNotificationInput = ActorNotificationInput &
  VerificationNotificationInput;

export type ActorOrganizationVerificationNotificationInput =
  ActorOrganizationNotificationInput & VerificationNotificationInput;

export class ActorNotificationUseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly actorRepository: ActorRepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    actorRepository: ActorRepositoryPort<Status, Extra>,
  ) {
    this.executionContext = executionContext;
    this.actorRepository = actorRepository;
  }

  async sendOrganizationWelcomeEmail(
    input: ActorOrganizationNotificationInput,
  ): Promise<void> {
    const provider = this.emailProvider();
    const actor = await this.findUserActor(input.actorId);
    actor.email.validate();

    await provider.sendEmail(Object.freeze({
      type: 'ORGANIZATION_WELCOME',
      actorId: actor.id,
      organizationId: input.organizationId,
      name: actor.name,
      to: actor.email.value,
    }));
  }

  async sendOrganizationInvitationEmail(
    input: ActorOrganizationVerificationNotificationInput,
  ): Promise<void> {
    const provider = this.emailProvider();
    const actor = await this.findUserActor(input.actorId);
    actor.email.validate();

    await provider.sendEmail(Object.freeze({
      type: 'ORGANIZATION_INVITATION',
      actorId: actor.id,
      organizationId: input.organizationId,
      name: actor.name,
      to: actor.email.value,
      verificationId: input.verificationId,
      credential: input.credential,
      expiresAt: input.expiresAt,
    }));
  }

  async sendEmailConfirmation(
    input: ActorVerificationNotificationInput,
  ): Promise<void> {
    const provider = this.emailProvider();
    const actor = await this.findUserActor(input.actorId);
    actor.email.validate();

    await provider.sendEmail(Object.freeze({
      type: 'EMAIL_CONFIRMATION',
      actorId: actor.id,
      name: actor.name,
      to: actor.email.value,
      verificationId: input.verificationId,
      credential: input.credential,
      expiresAt: input.expiresAt,
    }));
  }

  async sendTelephoneConfirmation(
    input: ActorVerificationNotificationInput,
  ): Promise<void> {
    const provider = this.telephoneProvider();
    const actor = await this.findUserActor(input.actorId);
    actor.telephone.validate();

    await provider.sendMessage(Object.freeze({
      type: 'TELEPHONE_CONFIRMATION',
      actorId: actor.id,
      name: actor.name,
      to: actor.telephone.value,
      verificationId: input.verificationId,
      credential: input.credential,
      expiresAt: input.expiresAt,
    }));
  }

  private emailProvider(): SendEmailPort {
    const provider = this.executionContext.sendEmailPort;
    if (!provider) throw ActorErrors.emailProviderNotConfigured();
    return provider;
  }

  private telephoneProvider(): SendTelefoneMessagePort {
    const provider = this.executionContext.sendTelefoneMessagePort;
    if (!provider) throw ActorErrors.telephoneProviderNotConfigured();
    return provider;
  }

  private async findUserActor(
    actorId: string,
  ): Promise<UserActor<Status, Extra>> {
    return await this.executionContext.databaseProvider.run(async () => {
      const actor = await this.actorRepository.findById(actorId);
      if (!actor) throw ActorErrors.notFound(actorId);
      if (actor.type !== 'USER') {
        throw ActorErrors.notificationRequiresUser(actorId);
      }
      return actor;
    });
  }
}
