import { Controller, Get, Inject, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ListActorsUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { ActorResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsListController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Get()
  @ApiOperation({ summary: "Lista actors" })
  @ApiOkResponse({ type: [ActorResponseDto] })
  async list(@Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new ListActorsUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { permissions: ["actors:read"] }),
      ),
    );
  }
}
