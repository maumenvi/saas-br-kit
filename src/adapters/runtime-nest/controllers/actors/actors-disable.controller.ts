import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DisableActorUseCase } from "#core";
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
export class ActorsDisableController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post(":actorId/disable")
  @ApiOperation({ summary: "Desativa um actor sem apagar credenciais ou histórico" })
  @ApiOkResponse({ type: ActorResponseDto })
  async disable(@Param("actorId") actorId: string, @Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new DisableActorUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { actorId }),
        { actorId },
      ),
    );
  }
}
