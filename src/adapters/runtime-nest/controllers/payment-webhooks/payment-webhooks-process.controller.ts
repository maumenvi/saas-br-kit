import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ProcessPaymentWebhookUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("payment webhooks")
@Controller("webhooks/payments")
export class PaymentWebhooksProcessController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Post(":provider/:webhookEventId/process")
  @ApiOkResponse({ description: "Webhook processed." })
  async process(@Param("webhookEventId") webhookEventId: string, @Req() request: NestRequestLike) {
    const executionContext = nestExecutionContextFactory.create(request);
    return nestHttpErrorMapper.unwrap(
      await new ProcessPaymentWebhookUseCase(this.options.appContext).execute(executionContext, {
        webhookEventId,
        allowReprocess: true,
      }),
    );
  }
}
