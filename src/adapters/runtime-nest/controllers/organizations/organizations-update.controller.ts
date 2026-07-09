import { Body, Controller, Inject, Param, Patch, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UpdateOrganizationUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { UpdateOrganizationBodyDto } from "../../dto/organization.dto.ts";
import { OrganizationResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsUpdateController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Patch(":organizationId")
  @ApiOperation({ summary: "Atualiza uma organization" })
  @ApiOkResponse({ type: OrganizationResponseDto })
  async update(
    @Param("organizationId") organizationId: string,
    @Body() body: UpdateOrganizationBodyDto,
    @Req() request: NestRequestLike,
  ) {
    return nestHttpErrorMapper.unwrap(
      await new UpdateOrganizationUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request),
        { organizationId, ...body },
      ),
    );
  }
}
