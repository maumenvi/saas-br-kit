import { Body, Controller, Inject, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { createActorInputSchema } from "#contracts";
import { CreateActorUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { CreateActorBodyDto } from "../../dto/actor.dto.ts";
import { ActorResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsCreateController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post()
  @ApiCreatedResponse({
    description: "Actor and password credentials created.",
    type: ActorResponseDto,
  })
  async create(@Body() body: CreateActorBodyDto, @Req() request: NestRequestLike) {
    const input = nestContractValidation.parse(createActorInputSchema, body);
    return nestHttpErrorMapper.unwrap(
      await new CreateActorUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { permissions: ["actors:write"] }),
        input,
      ),
    );
  }
}
