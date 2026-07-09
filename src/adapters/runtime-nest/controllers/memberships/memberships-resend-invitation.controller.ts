import { Controller, HttpCode, HttpStatus, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { NestRequestLike } from "../../context/execution-context.factory.ts";
import { InvitationDeliveryResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import { sendOrganizationInvitationEmail } from "../../invitations/invitation-email.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("organization invitations")
@Controller("organizations/:organizationId/actors/invitation")
export class MembershipsResendInvitationController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post("resend")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reenvia o convite pendente do actor autenticado" })
  @ApiOkResponse({
    description: "A new invitation token was sent.",
    type: InvitationDeliveryResponseDto,
  })
  async resend(@Param("organizationId") organizationId: string, @Req() request: NestRequestLike) {
    const userId = request.user?.userId;
    if (userId === undefined) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "membership.user_actor_required",
        message: "Resending an invitation requires an authenticated user actor.",
      });
    }

    const [membership, organization, user] = await Promise.all([
      this.options.appContext.repositories.memberships.findByOrganizationIdAndUserId({
        organizationId,
        userId,
      }),
      this.options.appContext.repositories.organizations.findById(organizationId),
      this.options.appContext.auth.users.findById(userId),
    ]);
    if (membership === null || membership.status !== "invited") {
      throw nestHttpErrorMapper.toException({
        kind: "not_found",
        code: "membership.invitation_not_found",
        message: "Pending organization invitation was not found.",
      });
    }
    if (organization === null || user === null) {
      throw nestHttpErrorMapper.toException({
        kind: "not_found",
        code: "membership.invitation_context_not_found",
        message: "Invitation organization or actor was not found.",
      });
    }

    const invitation = await sendOrganizationInvitationEmail(this.options, {
      to: user.email,
      userId,
      organizationId,
      organizationName: organization.name,
      role: membership.role,
      ...(membership.invitedByUserId === undefined
        ? {}
        : { invitedByUserId: membership.invitedByUserId }),
    });
    return Object.freeze({ expiresAt: invitation.expiresAt });
  }
}
