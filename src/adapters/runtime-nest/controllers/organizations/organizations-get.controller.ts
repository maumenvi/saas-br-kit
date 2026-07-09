import { Controller, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetOrganizationUseCase } from "#core";
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
export class OrganizationsGetController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Get(":organizationId")
  @ApiOperation({ summary: "Obtém uma organization" })
  @ApiOkResponse({ type: OrganizationResponseDto })
  async get(@Param("organizationId") organizationId: string, @Req() request: NestRequestLike) {
    return nestHttpErrorMapper.unwrap(
      await new GetOrganizationUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request),
        { organizationId },
      ),
    );
  }
}
