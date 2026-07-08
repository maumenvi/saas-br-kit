import { Body, Controller, Inject, Param, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChangeOrganizationMemberRoleUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { ChangeOrganizationActorRoleBodyDto } from "../../dto/membership.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization actors")
@Controller("organizations/:organizationId/actors")
export class MembershipsChangeRoleController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Patch(":actorId/role")
  @ApiOperation({ summary: "Altera a role do actor nessa organization" })
  async changeRole(
    @Param("organizationId") organizationId: string,
    @Param("actorId") actorId: string,
    @Body() body: ChangeOrganizationActorRoleBodyDto,
    @Req() request: NestRequestLike,
  ) {
    return nestHttpErrorMapper.unwrap(
      await new ChangeOrganizationMemberRoleUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { organizationId }),
        { organizationId, userId: actorId, role: body.role },
      ),
    );
  }
}
