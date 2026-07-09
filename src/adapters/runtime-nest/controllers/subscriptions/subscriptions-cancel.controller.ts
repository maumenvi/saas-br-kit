import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CancelSubscriptionUseCase } from "#core";
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
export class SubscriptionsCancelController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Post(":subscriptionId/cancel")
  @ApiOperation({
    summary: "Cancela a subscription no provider e mantém o registro para histórico",
  })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  async cancel(@Param("subscriptionId") subscriptionId: string, @Req() request: NestRequestLike) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    return nestHttpErrorMapper.unwrap(
      await new CancelSubscriptionUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId, subscriptionId },
      ),
    );
  }
}
