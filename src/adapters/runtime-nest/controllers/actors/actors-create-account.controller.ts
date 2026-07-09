import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createActorInputSchema,
  createOrganizationInputSchema,
  loginInputSchema,
} from "#contracts";
import { CreateActorUseCase, CreateOrganizationUseCase, LoginWithPasswordUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { CreateAccountBodyDto } from "../../dto/actor.dto.ts";
import { CreateAccountResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { sendOptionalEmailNotification } from "../../notifications/send-optional-email-notification.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsCreateAccountController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Post("account")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Cria account completa com actor, login e organization inicial" })
  @ApiCreatedResponse({
    description: "Account created with actor, organization and tokens.",
    type: CreateAccountResponseDto,
  })
  async createAccount(@Body() body: CreateAccountBodyDto, @Req() request: NestRequestLike) {
    if (typeof body.organizationName !== "string" || body.organizationName.trim().length === 0) {
      throw nestHttpErrorMapper.toException({
        kind: "validation",
        code: "request.body_invalid",
        message: "Request body did not match contract schema.",
        details: {
          issues: [{ path: ["organizationName"], message: "Expected non-empty organizationName." }],
        },
      });
    }

    const actorInput = nestContractValidation.parse(createActorInputSchema, body);
    const actor = nestHttpErrorMapper.unwrap(
      await new CreateActorUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { permissions: ["actors:write"] }),
        actorInput,
      ),
    );

    const organizationInput = nestContractValidation.parse(createOrganizationInputSchema, {
      ownerUserId: actor.id,
      name: body.organizationName,
      ...(body.organizationSubdomain === undefined
        ? {}
        : { subdomain: body.organizationSubdomain }),
      ...(body.organizationUrl === undefined ? {} : { url: body.organizationUrl }),
    });
    const organization = nestHttpErrorMapper.unwrap(
      await new CreateOrganizationUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, { actorId: actor.id }),
        organizationInput,
      ),
    );

    const loginInput = nestContractValidation.parse(loginInputSchema, {
      email: body.email,
      password: body.password,
      ...(body.deviceId === undefined ? {} : { deviceId: body.deviceId }),
    });
    const login = nestHttpErrorMapper.unwrap(
      await new LoginWithPasswordUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request),
        loginInput,
      ),
    );

    await sendOptionalEmailNotification(
      this.options.appContext as SaasBrNestOptions["appContext"] & {
        notifications?: Readonly<{
          email?: Readonly<Record<string, unknown>>;
        }>;
      },
      "sendAccountCreatedEmail",
      {
        to: actor.email,
        userId: actor.id,
        ...(actor.displayName === undefined ? {} : { displayName: actor.displayName }),
        organizationId: organization.id,
        organizationName: organization.name,
        ...(organization.subdomain === undefined
          ? {}
          : { organizationSubdomain: organization.subdomain }),
        ...(organization.url === undefined ? {} : { organizationUrl: organization.url }),
      },
    );

    return {
      ...login,
      organization,
    };
  }
}
