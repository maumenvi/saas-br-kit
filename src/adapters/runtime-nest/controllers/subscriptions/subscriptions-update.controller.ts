import { Body, Controller, Inject, Param, Patch, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UpdateSubscriptionUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { SubscriptionResponseDto } from "../../dto/response.dto.ts";
import { UpdateSubscriptionBodyDto } from "../../dto/subscription.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("subscriptions")
@Controller("billing/subscriptions")
export class SubscriptionsUpdateController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Patch(":subscriptionId")
  @ApiOperation({ summary: "Atualiza vínculo local e metadata da subscription" })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  async update(
    @Param("subscriptionId") subscriptionId: string,
    @Body() body: UpdateSubscriptionBodyDto,
    @Req() request: NestRequestLike,
  ) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    return nestHttpErrorMapper.unwrap(
      await new UpdateSubscriptionUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId, subscriptionId, ...body },
      ),
    );
  }
}
