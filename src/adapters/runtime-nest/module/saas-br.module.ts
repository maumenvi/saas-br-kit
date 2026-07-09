import { type DynamicModule, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.ts";
import {
  ActorsChangePasswordController,
  ActorsCreateAccountController,
  ActorsCreateController,
  ActorsDisableController,
  ActorsForgotPasswordController,
  ActorsGetController,
  ActorsListController,
  ActorsLoginController,
  ActorsRefreshTokenController,
  ActorsResetPasswordController,
  ActorsUpdateController,
} from "../controllers/actors/index.ts";
import {
  CustomersCreateController,
  CustomersDisableController,
  CustomersGetController,
  CustomersListController,
  CustomersUpdateController,
} from "../controllers/customers/index.ts";
import { HealthController } from "../controllers/health/index.ts";
import {
  MembershipsAcceptController,
  MembershipsAcceptPublicInvitationController,
  MembershipsChangeRoleController,
  MembershipsCreateInvitedActorController,
  MembershipsDisableController,
  MembershipsInviteController,
  MembershipsListController,
  MembershipsResendInvitationController,
} from "../controllers/memberships/index.ts";
import { ObservabilityController } from "../controllers/observability/index.ts";
import {
  OidcCallbackController,
  OidcLinkStartController,
  OidcLoginStartController,
} from "../controllers/oidc/index.ts";
import {
  OrganizationsCreateController,
  OrganizationsDisableController,
  OrganizationsGetController,
  OrganizationsListController,
  OrganizationsUpdateController,
} from "../controllers/organizations/index.ts";
import {
  PaymentWebhooksProcessController,
  PaymentWebhooksReceiveController,
} from "../controllers/payment-webhooks/index.ts";
import {
  PlansCreateController,
  PlansDisableController,
  PlansGetController,
  PlansListController,
  PlansUpdateController,
} from "../controllers/plans/index.ts";
import {
  SubscriptionsCancelController,
  SubscriptionsCreateController,
  SubscriptionsGetController,
  SubscriptionsListController,
  SubscriptionsUpdateController,
} from "../controllers/subscriptions/index.ts";
import { UnhandledExceptionFilter } from "../errors/unhandled-exception.filter.ts";
import type { SaasBrNestAsyncOptions, SaasBrNestOptions } from "./options.ts";
import { SAAS_BR_NEST_OPTIONS } from "./tokens.ts";

const controllers = [
  ActorsChangePasswordController,
  ActorsCreateAccountController,
  ActorsCreateController,
  ActorsDisableController,
  ActorsForgotPasswordController,
  ActorsGetController,
  ActorsListController,
  ActorsLoginController,
  ActorsRefreshTokenController,
  ActorsResetPasswordController,
  ActorsUpdateController,
  CustomersCreateController,
  CustomersDisableController,
  CustomersGetController,
  CustomersListController,
  CustomersUpdateController,
  HealthController,
  MembershipsAcceptController,
  MembershipsAcceptPublicInvitationController,
  MembershipsChangeRoleController,
  MembershipsCreateInvitedActorController,
  MembershipsDisableController,
  MembershipsInviteController,
  MembershipsListController,
  MembershipsResendInvitationController,
  OrganizationsCreateController,
  OrganizationsDisableController,
  OrganizationsGetController,
  OrganizationsListController,
  OrganizationsUpdateController,
  OidcCallbackController,
  OidcLinkStartController,
  OidcLoginStartController,
  ObservabilityController,
  PaymentWebhooksProcessController,
  PaymentWebhooksReceiveController,
  PlansCreateController,
  PlansDisableController,
  PlansGetController,
  PlansListController,
  PlansUpdateController,
  SubscriptionsCancelController,
  SubscriptionsCreateController,
  SubscriptionsGetController,
  SubscriptionsListController,
  SubscriptionsUpdateController,
];

/** Registers SaaS BR Core use cases behind Nest REST controllers. */
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: Nest modules expose static registration factories by convention.
export class SaasBrModule {
  /** Registers static options for the Nest runtime adapter. */
  static forRoot(options: SaasBrNestOptions): DynamicModule {
    return {
      module: SaasBrModule,
      controllers,
      providers: [
        { provide: SAAS_BR_NEST_OPTIONS, useValue: options },
        Reflector,
        {
          provide: APP_GUARD,
          inject: [Reflector, SAAS_BR_NEST_OPTIONS],
          useFactory: (reflector: Reflector, resolvedOptions: SaasBrNestOptions) =>
            new JwtAuthGuard(reflector, resolvedOptions),
        },
        {
          provide: APP_FILTER,
          useClass: UnhandledExceptionFilter,
        },
      ],
      exports: [SAAS_BR_NEST_OPTIONS],
    };
  }

  /** Registers async options for the Nest runtime adapter. */
  static forRootAsync(options: SaasBrNestAsyncOptions): DynamicModule {
    return {
      module: SaasBrModule,
      imports: [...(options.imports ?? [])] as never[],
      controllers,
      providers: [
        {
          provide: SAAS_BR_NEST_OPTIONS,
          inject: [...(options.inject ?? [])] as never[],
          useFactory: options.useFactory,
        },
        Reflector,
        {
          provide: APP_GUARD,
          inject: [Reflector, SAAS_BR_NEST_OPTIONS],
          useFactory: (reflector: Reflector, resolvedOptions: SaasBrNestOptions) =>
            new JwtAuthGuard(reflector, resolvedOptions),
        },
        {
          provide: APP_FILTER,
          useClass: UnhandledExceptionFilter,
        },
      ],
      exports: [SAAS_BR_NEST_OPTIONS],
    };
  }
}
