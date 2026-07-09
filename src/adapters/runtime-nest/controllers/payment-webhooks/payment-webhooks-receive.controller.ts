import { Body, Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiAcceptedResponse, ApiHeader, ApiTags } from "@nestjs/swagger";
import { safeMetadataSchema } from "#contracts";
import { ReceivePaymentWebhookUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { ReceivePaymentWebhookBodyDto } from "../../dto/webhook.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("payment webhooks")
@Controller("webhooks/payments")
export class PaymentWebhooksReceiveController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Post(":provider")
  @ApiHeader({
    name: "asaas-webhook-token",
    required: true,
    description:
      "Asaas webhook token. For Asaas provider, send the same value configured as webhookToken.",
  })
  @ApiHeader({
    name: "x-asaas-webhook-token",
    required: false,
    description:
      "Alternative header accepted for compatibility. Use the same token as asaas-webhook-token.",
  })
  @ApiAcceptedResponse({ description: "Webhook received." })
  async receive(
    @Param("provider") provider: string,
    @Body() body: ReceivePaymentWebhookBodyDto,
    @Req() request: NestRequestLike,
  ) {
    const metadata =
      body.metadata === undefined
        ? undefined
        : nestContractValidation.parse(safeMetadataSchema, body.metadata);
    const executionContext = nestExecutionContextFactory.create(request, {
      ...(body.organizationId === undefined ? {} : { organizationId: body.organizationId }),
    });
    return nestHttpErrorMapper.unwrap(
      await new ReceivePaymentWebhookUseCase(this.options.appContext).execute(executionContext, {
        provider,
        providerEventId: body.providerEventId,
        eventName: body.eventName,
        rawPayload: body.rawPayload as never,
        ...(request.headers === undefined
          ? {}
          : {
              headers: Object.fromEntries(
                Object.entries(request.headers).filter(
                  (entry): entry is [string, string | readonly string[]] => entry[1] !== undefined,
                ),
              ),
            }),
        ...(body.organizationId === undefined ? {} : { organizationId: body.organizationId }),
        ...(body.providerConnectionId === undefined
          ? {}
          : { providerConnectionId: body.providerConnectionId }),
        ...(body.providerAccountId === undefined
          ? {}
          : { providerAccountId: body.providerAccountId }),
        ...(metadata === undefined ? {} : { metadata }),
      }),
    );
  }
}
