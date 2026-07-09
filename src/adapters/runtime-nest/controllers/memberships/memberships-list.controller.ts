import { Controller, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ListOrganizationMembersUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization actors")
@Controller("organizations/:organizationId/actors")
export class MembershipsListController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Get()
  @ApiOperation({ summary: "Lista actors e memberships da organization" })
  async list(@Param("organizationId") organizationId: string, @Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new ListOrganizationMembersUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId },
      ),
    );
  }
}
