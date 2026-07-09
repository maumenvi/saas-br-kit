import { Body, Controller, Inject, Param, Patch, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { updateActorInputSchema } from "#contracts";
import { UpdateActorUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { UpdateActorBodyDto } from "../../dto/actor.dto.ts";
import { ActorResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsUpdateController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Patch(":actorId")
  @ApiOkResponse({ type: ActorResponseDto })
  async update(
    @Param("actorId") actorId: string,
    @Body() body: UpdateActorBodyDto,
    @Req() request: NestRequestLike,
  ) {
    const input = nestContractValidation.parse(updateActorInputSchema, body);
    return nestHttpErrorMapper.unwrap(
      await new UpdateActorUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { actorId }),
        { actorId, ...input },
      ),
    );
  }
}
