import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { loginInputSchema } from "#contracts";
import { LoginWithPasswordUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { LoginActorBodyDto } from "../../dto/actor.dto.ts";
import { ActorLoginResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsLoginController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Autentica um actor e filtra organizations pela URL opcional" })
  @ApiOkResponse({
    description: "Tokens and accessible organizations.",
    type: ActorLoginResponseDto,
  })
  async login(@Body() body: LoginActorBodyDto, @Req() request: NestRequestLike) {
    const input = nestContractValidation.parse(loginInputSchema, body);
    return nestHttpErrorMapper.unwrap(
      await new LoginWithPasswordUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request),
        input,
      ),
    );
  }
}
