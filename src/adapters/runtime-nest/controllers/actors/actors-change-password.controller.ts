import { BadRequestException, Body, Controller, Inject, Param, Patch, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserCredentials } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { ChangeActorPasswordBodyDto } from "../../dto/actor.dto.ts";
import { ChangePasswordResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { sendOptionalEmailNotification } from "../../notifications/send-optional-email-notification.ts";

type ChangePasswordInput = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;

@ApiTags("actors")
@Controller("actors")
export class ActorsChangePasswordController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Patch(":actorId/password")
  @ApiOperation({ summary: "Troca a senha de um actor autenticado" })
  @ApiOkResponse({ type: ChangePasswordResponseDto })
  async changePassword(
    @Param("actorId") actorId: string,
    @Body() body: ChangeActorPasswordBodyDto,
    @Req() request: NestRequestLike,
  ) {
    const input = this.parseBody(body);
    const executionContext = nestExecutionContextFactory.create(request, { actorId });

    if (
      executionContext.actor.type !== "system" &&
      (executionContext.actor.type !== "user" || executionContext.actor.id !== actorId)
    ) {
      return nestHttpErrorMapper.unwrap({
        ok: false,
        error: {
          kind: "authorization",
          code: "core.actor_user_mismatch",
          message: "Execution actor cannot represent the requested user.",
        },
      });
    }

    const user = await this.options.appContext.auth.users.findById(actorId);
    if (user === null) {
      return nestHttpErrorMapper.unwrap({
        ok: false,
        error: {
          kind: "not_found",
          code: "auth.user_not_found",
          message: "Authenticated user was not found.",
        },
      });
    }
    if (user.status !== "active") {
      return nestHttpErrorMapper.unwrap({
        ok: false,
        error: {
          kind: "authorization",
          code: "auth.user_disabled",
          message: "Authenticated user is disabled.",
        },
      });
    }

    const currentCredentials = await this.options.appContext.auth.userCredentials.findByEmail(
      user.email,
    );
    if (currentCredentials === null || currentCredentials.status !== "active") {
      return nestHttpErrorMapper.unwrap({
        ok: false,
        error: {
          kind: "authorization",
          code: "auth.invalid_credentials",
          message: "Email or password is invalid.",
        },
      });
    }

    const currentPasswordValid = await this.options.appContext.auth.passwordHasher.verifyPassword({
      password: input.currentPassword,
      passwordHash: currentCredentials.passwordHash,
    });
    if (!currentPasswordValid) {
      return nestHttpErrorMapper.unwrap({
        ok: false,
        error: {
          kind: "authorization",
          code: "auth.invalid_credentials",
          message: "Email or password is invalid.",
        },
      });
    }

    const updatedCredentials = UserCredentials.create({
      userId: currentCredentials.userId,
      email: currentCredentials.email,
      passwordHash: await this.options.appContext.auth.passwordHasher.hashPassword(
        input.newPassword,
      ),
      status: currentCredentials.status,
      createdAt: currentCredentials.createdAt,
      updatedAt: this.options.appContext.clock.now().toISOString(),
    });
    if (!updatedCredentials.ok) {
      return nestHttpErrorMapper.unwrap(updatedCredentials);
    }

    await this.options.appContext.auth.userCredentials.save(updatedCredentials.data);
    this.options.appContext.logger.info("Actor password changed.", {
      requestId: executionContext.requestId,
      actorId,
    });

    await sendOptionalEmailNotification(
      this.options.appContext as SaasBrNestOptions["appContext"] & {
        notifications?: Readonly<{
          email?: Readonly<Record<string, unknown>>;
        }>;
      },
      "sendPasswordChangedEmail",
      {
        to: user.email,
        userId: user.id,
        ...(user.displayName === undefined ? {} : { displayName: user.displayName }),
        changedAt: this.options.appContext.clock.now().toISOString(),
      },
    );

    return { changed: true };
  }

  private parseBody(body: ChangeActorPasswordBodyDto): ChangePasswordInput {
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;
    if (typeof currentPassword !== "string" || currentPassword.trim().length === 0) {
      throw new BadRequestException({
        error: {
          code: "request.body_invalid",
          message: "currentPassword must be a non-empty string.",
        },
      });
    }
    if (typeof newPassword !== "string" || newPassword.trim().length < 8) {
      throw new BadRequestException({
        error: {
          code: "request.body_invalid",
          message: "newPassword must have at least 8 characters.",
        },
      });
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException({
        error: {
          code: "request.body_invalid",
          message: "newPassword must be different from currentPassword.",
        },
      });
    }
    return Object.freeze({ currentPassword, newPassword });
  }
}
