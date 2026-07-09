import { Body, Controller, Inject, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { createPlanInputSchema } from "#contracts";
import { CreatePlanUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { CreatePlanBodyDto } from "../../dto/plan.dto.ts";
import { CreatePlanResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("plans")
@Controller("plans")
export class PlansCreateController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Post()
  @ApiCreatedResponse({
    description: "Plan, billing event and audit event created. No subscription is created.",
    type: CreatePlanResponseDto,
  })
  async create(@Body() body: CreatePlanBodyDto, @Req() request: NestRequestLike) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    const input = nestContractValidation.parse(createPlanInputSchema, {
      ...body,
      organizationId,
    });
    const executionContext = nestExecutionContextFactory.create(request, {
      organizationId,
      permissions: ["billing:plans:write"],
    });
    return nestHttpErrorMapper.unwrap(
      await new CreatePlanUseCase(this.options.appContext).execute(executionContext, input),
    );
  }
}
