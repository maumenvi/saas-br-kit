import { Body, Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { InviteOrganizationMemberUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { InviteOrganizationActorBodyDto } from "../../dto/membership.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization actors")
@Controller("organizations/:organizationId/actors")
export class MembershipsInviteController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post()
  @ApiOperation({ summary: "Convida um actor com uma role de funcionário" })
  async invite(
    @Param("organizationId") organizationId: string,
    @Body() body: InviteOrganizationActorBodyDto,
    @Req() request: NestRequestLike,
  ) {
    return nestHttpErrorMapper.unwrap(
      await new InviteOrganizationMemberUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId, userId: body.userId, role: body.role },
      ),
    );
  }
}
