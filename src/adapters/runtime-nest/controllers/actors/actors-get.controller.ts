import { Controller, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { GetActorUseCase } from "#core";
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
export class ActorsGetController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Get(":actorId")
  @ApiOkResponse({ type: ActorResponseDto })
  async get(@Param("actorId") actorId: string, @Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new GetActorUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { actorId }),
        { actorId },
      ),
    );
  }
}
