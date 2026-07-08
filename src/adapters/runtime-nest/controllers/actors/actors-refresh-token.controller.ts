import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RefreshAuthTokenUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { RefreshActorTokenBodyDto } from "../../dto/actor.dto.ts";
import { RefreshActorTokenResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsRefreshTokenController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Post("token/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotaciona o refresh token e emite um novo par de tokens" })
  @ApiOkResponse({
    description: "New access and refresh tokens.",
    type: RefreshActorTokenResponseDto,
  })
  async refresh(@Body() body: RefreshActorTokenBodyDto, @Req() request: NestRequestLike) {
    if (typeof body.refreshToken !== "string" || body.refreshToken.trim().length === 0) {
      throw nestHttpErrorMapper.toException({
        kind: "validation",
        code: "request.body_invalid",
        message: "Refresh token is required.",
      });
    }

    const memberships = await this.loadTrustedMembershipClaims(body.refreshToken);
    return nestHttpErrorMapper.unwrap(
      await new RefreshAuthTokenUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request),
        {
          refreshToken: body.refreshToken,
          ...(body.deviceId === undefined ? {} : { deviceId: body.deviceId }),
          ...(memberships === undefined ? {} : { memberships }),
        },
      ),
    );
  }

  private async loadTrustedMembershipClaims(refreshToken: string) {
    const secretHash = await this.options.appContext.auth.refreshTokens.hashSecret(refreshToken);
    const session = await this.options.appContext.auth.refreshTokens.findBySecretHash(secretHash);
    if (session === null) {
      return undefined;
    }
    const memberships = await this.options.appContext.repositories.memberships.listByUserId(
      session.userId,
    );
    return Object.freeze(
      memberships.map((membership) =>
        Object.freeze({
          organizationId: membership.organizationId,
          role: membership.role,
          status: membership.status,
        }),
      ),
    );
  }
}
