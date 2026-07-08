import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { RemoveOrganizationMemberUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization actors")
@Controller("organizations/:organizationId/actors")
export class MembershipsDisableController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post(":actorId/disable")
  @ApiOperation({ summary: "Desativa o acesso do actor sem apagar a membership" })
  async disable(
    @Param("organizationId") organizationId: string,
    @Param("actorId") actorId: string,
    @Req() request: NestRequestLike,
  ) {
    return nestHttpErrorMapper.unwrap(
      await new RemoveOrganizationMemberUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId, userId: actorId },
      ),
    );
  }
}
