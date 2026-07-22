import {
  ActorNotificationUseCase,
  type ActorOrganizationNotificationInput,
  type ActorOrganizationVerificationNotificationInput,
  type ActorVerificationNotificationInput,
} from '../../../core/entities/actor/application/actor.notification.ts';
import type { Handler } from '../../../core/shared/application/handler.ts';
import { withDefaultInterceptors } from '../shared/default.interceptors.ts';
import type { ActorCompositionInput } from './actor.composition.input.ts';

export function composeActorSendOrganizationWelcomeEmail<
  Status,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: ActorCompositionInput<Status, ActorExtra, MembershipStatus, MembershipExtra>,
): Handler<ActorOrganizationNotificationInput, void> {
  const useCase = new ActorNotificationUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(
    useCase.sendOrganizationWelcomeEmail.bind(useCase),
    {
      action: 'actor:send-organization-welcome-email',
      permission: 'organization:create',
      idempotent: false,
      ...input,
    },
  );
}

export function composeActorSendOrganizationInvitationEmail<
  Status,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: ActorCompositionInput<Status, ActorExtra, MembershipStatus, MembershipExtra>,
): Handler<ActorOrganizationVerificationNotificationInput, void> {
  const useCase = new ActorNotificationUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(
    useCase.sendOrganizationInvitationEmail.bind(useCase),
    {
      action: 'actor:send-organization-invitation-email',
      permission: 'membership:create',
      idempotent: false,
      ...input,
    },
  );
}

export function composeActorSendEmailConfirmation<
  Status,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: ActorCompositionInput<Status, ActorExtra, MembershipStatus, MembershipExtra>,
): Handler<ActorVerificationNotificationInput, void> {
  const useCase = new ActorNotificationUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(
    useCase.sendEmailConfirmation.bind(useCase),
    {
      action: 'actor:send-email-confirmation',
      permission: 'actor:update',
      idempotent: false,
      ...input,
    },
  );
}

export function composeActorSendTelephoneConfirmation<
  Status,
  MembershipStatus,
  ActorExtra = unknown,
  MembershipExtra = unknown,
>(
  input: ActorCompositionInput<Status, ActorExtra, MembershipStatus, MembershipExtra>,
): Handler<ActorVerificationNotificationInput, void> {
  const useCase = new ActorNotificationUseCase(
    input.executionContext,
    input.actorRepository,
  );

  return withDefaultInterceptors(
    useCase.sendTelephoneConfirmation.bind(useCase),
    {
      action: 'actor:send-telephone-confirmation',
      permission: 'actor:update',
      idempotent: false,
      ...input,
    },
  );
}
