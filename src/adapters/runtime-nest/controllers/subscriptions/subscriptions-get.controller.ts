import { Controller, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetSubscriptionUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { SubscriptionResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("subscriptions")
@Controller("billing/subscriptions")
export class SubscriptionsGetController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Get(":subscriptionId")
  @ApiOperation({ summary: "Obtém uma subscription" })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  async get(@Param("subscriptionId") subscriptionId: string, @Req() request: NestRequestLike) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    return nestHttpErrorMapper.unwrap(
      await new GetSubscriptionUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId, subscriptionId },
      ),
    );
  }
}
