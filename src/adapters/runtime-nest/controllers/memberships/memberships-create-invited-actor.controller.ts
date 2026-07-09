import { Body, Controller, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { createActorInputSchema } from "#contracts";
import type { ExecutionActor, Organization } from "#core";
import { CreateActorUseCase, InviteOrganizationMemberUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { CreateInvitedOrganizationActorBodyDto } from "../../dto/membership.dto.ts";
import { CreateInvitedActorResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import { sendOrganizationInvitationEmail } from "../../invitations/invitation-email.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("organization actors")
@Controller("organizations/:organizationId/actors")
export class MembershipsCreateInvitedActorController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Post("account")
  @ApiOperation({ summary: "Cria um actor e envia convite para a organization" })
  @ApiCreatedResponse({
    description: "Actor created with a pending organization membership.",
    type: CreateInvitedActorResponseDto,
  })
  async createInvitedActor(
    @Param("organizationId") organizationId: string,
    @Body() body: CreateInvitedOrganizationActorBodyDto,
    @Req() request: NestRequestLike,
  ) {
    const executionContext = nestExecutionContextFactory.create(request, { organizationId });
    const organization =
      await this.options.appContext.repositories.organizations.findById(organizationId);
    if (organization === null) {
      throw nestHttpErrorMapper.toException({
        kind: "not_found",
        code: "organization.not_found",
        message: "Organization was not found.",
      });
    }
    await this.ensureCanInvite(organizationId, executionContext.actor, organization);
    if (body.role === organization.roleConfig.ownerRoleName) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "membership.owner_invitation_forbidden",
        message: "The owner role cannot be assigned through an employee invitation.",
      });
    }
    if (!organization.roleConfig.employeeRoles.some((role) => role.name === body.role)) {
      throw nestHttpErrorMapper.toException({
        kind: "not_found",
        code: "membership.role_not_found",
        message: "Employee role is not configured for this organization.",
      });
    }

    const actorInput = nestContractValidation.parse(createActorInputSchema, body);
    const actor = nestHttpErrorMapper.unwrap(
      await new CreateActorUseCase(this.options.appContext).execute(executionContext, actorInput),
    );

    const { notifications: _notifications, ...appContextWithoutEmail } = this.options.appContext;
    const membership = nestHttpErrorMapper.unwrap(
      await new InviteOrganizationMemberUseCase(appContextWithoutEmail).execute(executionContext, {
        organizationId,
        userId: actor.id,
        role: body.role,
      }),
    );

    const invitation = await sendOrganizationInvitationEmail(this.options, {
      to: actor.email,
      userId: actor.id,
      organizationId,
      organizationName: organization.name,
      role: membership.role,
      ...(membership.invitedByUserId === undefined
        ? {}
        : { invitedByUserId: membership.invitedByUserId }),
    });

    return Object.freeze({
      actor,
      membership,
      invitation: Object.freeze({ expiresAt: invitation.expiresAt }),
    });
  }

  private async ensureCanInvite(
    organizationId: string,
    actor: ExecutionActor,
    organization: Organization,
  ): Promise<void> {
    if (actor.type === "system" || actor.id === organization.ownerUserId) {
      return;
    }
    if (actor.type !== "user" || actor.id === undefined) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "membership.user_actor_required",
        message: "Membership operations require a user actor.",
      });
    }
    const membership =
      await this.options.appContext.repositories.memberships.findByOrganizationIdAndUserId({
        organizationId,
        userId: actor.id,
      });
    if (
      membership === null ||
      !membership.allowsPermission("organization:members:invite", organization.roleConfig)
    ) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "membership.permission_denied",
        message: "Actor does not have the required organization membership permission.",
      });
    }
  }
}
