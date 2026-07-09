import { Body, Controller, Inject, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { createOrganizationInputSchema } from "#contracts";
import { CreateOrganizationUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { CreateOrganizationBodyDto } from "../../dto/organization.dto.ts";
import { OrganizationResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsCreateController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post()
  @ApiCreatedResponse({ description: "Organization created.", type: OrganizationResponseDto })
  async create(@Body() body: CreateOrganizationBodyDto, @Req() request: NestRequestLike) {
    const input = nestContractValidation.parse(createOrganizationInputSchema, body);
    const executionContext = nestExecutionContextFactory.create(request, {
      actorId: input.ownerUserId,
    });
    return nestHttpErrorMapper.unwrap(
      await new CreateOrganizationUseCase(this.options.appContext).execute(executionContext, input),
    );
  }
}
