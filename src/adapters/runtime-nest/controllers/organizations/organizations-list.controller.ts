import { Controller, ForbiddenException, Get, Inject, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ListOrganizationsUseCase } from "#core";
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
export class OrganizationsListController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Get()
  @ApiOperation({ summary: "Lista organizations pertencentes a um actor" })
  @ApiOkResponse({
    description: "Organizations acessíveis pelo proprietário informado.",
    type: [OrganizationResponseDto],
  })
  async list(@Req() request: NestRequestLike) {
    const executionContext = nestExecutionContextFactory.create(request);
    const ownerUserId =
      executionContext.actor.type === "user" ? executionContext.actor.id : request.user?.userId;
    if (ownerUserId === undefined) {
      throw new ForbiddenException({
        error: {
          kind: "authorization",
          code: "auth.user_identity_required",
          message: "Authenticated user identity is required.",
        },
      });
    }
    return nestHttpErrorMapper.unwrap(
      await new ListOrganizationsUseCase(this.options.appContext).execute(executionContext, {
        ownerUserId,
      }),
    );
  }
}
