import { Controller, Get, Inject, Query, UnauthorizedException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AcceptOrganizationInvitationUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import { nestExecutionContextFactory } from "../../context/execution-context.factory.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import { resolveInvitationSettings } from "../../invitations/invitation-settings.ts";
import {
  InvitationTokenError,
  InvitationTokenService,
} from "../../invitations/invitation-token.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization invitations")
@Controller("organization-invitations")
export class MembershipsAcceptPublicInvitationController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Get("accept")
  @ApiOperation({ summary: "Ativa uma membership usando o token recebido por email" })
  @ApiQuery({ name: "token", description: "Token temporário de convite.", required: true })
  @ApiOkResponse({ description: "Invitation accepted and membership activated." })
  async accept(@Query("token") token: string | undefined) {
    const invitation = this.verifyToken(token);
    return nestHttpErrorMapper.unwrap(
      await new AcceptOrganizationInvitationUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(undefined, {
          actorId: invitation.userId,
          organizationId: invitation.organizationId,
        }),
        { organizationId: invitation.organizationId },
      ),
    );
  }

  private verifyToken(token: string | undefined) {
    try {
      if (token === undefined || token.trim().length === 0) {
        throw new InvitationTokenError("invitation.token_invalid", "Invitation token is required.");
      }
      const settings = resolveInvitationSettings(this.options);
      return new InvitationTokenService(settings.tokenSecret, settings.tokenTtlMs).verify(
        token,
        this.options.appContext.clock.now(),
      );
    } catch (error) {
      if (!(error instanceof InvitationTokenError)) {
        throw error;
      }
      throw new UnauthorizedException({
        error: {
          kind: "authorization",
          code: error.code,
          message: error.message,
        },
      });
    }
  }
}
