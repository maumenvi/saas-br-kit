import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AcceptOrganizationInvitationUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization actors")
@Controller("organizations/:organizationId/actors")
export class MembershipsAcceptController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post("accept")
  @ApiOperation({ summary: "Aceita o convite do actor autenticado" })
  async accept(@Param("organizationId") organizationId: string, @Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new AcceptOrganizationInvitationUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId },
      ),
    );
  }
}
