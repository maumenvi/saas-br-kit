import { Body, Controller, Inject, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { createSubscriptionInputSchema } from "#contracts";
import { CreateSubscriptionUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { CreateSubscriptionResponseDto } from "../../dto/response.dto.ts";
import { CreateSubscriptionBodyDto } from "../../dto/subscription.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("subscriptions")
@Controller("billing/subscriptions")
export class SubscriptionsCreateController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Post()
  @ApiCreatedResponse({
    description: "Subscription and billing/audit events created.",
    type: CreateSubscriptionResponseDto,
  })
  async create(@Body() body: CreateSubscriptionBodyDto, @Req() request: NestRequestLike) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    const input = nestContractValidation.parse(createSubscriptionInputSchema, {
      ...body,
      organizationId,
    });
    const executionContext = nestExecutionContextFactory.create(request, {
      organizationId,
    });
    return nestHttpErrorMapper.unwrap(
      await new CreateSubscriptionUseCase(this.options.appContext).execute(executionContext, input),
    );
  }
}
