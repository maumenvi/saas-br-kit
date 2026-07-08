import { Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DisableOrganizationUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { OrganizationResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsDisableController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post(":organizationId/disable")
  @ApiOperation({ summary: "Desativa uma organization sem apagar seu histórico" })
  @ApiOkResponse({ type: OrganizationResponseDto })
  async disable(@Param("organizationId") organizationId: string, @Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new DisableOrganizationUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request),
        { organizationId },
      ),
    );
  }
}
