import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserCredentials } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { ResetPasswordBodyDto } from "../../dto/actor.dto.ts";
import { ResetPasswordResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { sendOptionalEmailNotification } from "../../notifications/send-optional-email-notification.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsResetPasswordController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  private get passwordResetTokens() {
    return (
      this.options.appContext.auth as {
        passwordResetTokens?: Readonly<{
          save(record: Readonly<Record<string, unknown>>): Promise<void>;
          findBySecretHash(secretHash: string): Promise<Readonly<Record<string, unknown>> | null>;
        }>;
      }
    ).passwordResetTokens;
  }

  @PublicRoute()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Redefine senha com token de recuperação" })
  @ApiOkResponse({ type: ResetPasswordResponseDto })
  async resetPassword(@Body() body: ResetPasswordBodyDto, @Req() request: NestRequestLike) {
    if (typeof body.token !== "string" || body.token.trim().length === 0) {
      throw nestHttpErrorMapper.toException({
        kind: "validation",
        code: "request.body_invalid",
        message: "token must be a non-empty string.",
      });
    }
    if (typeof body.newPassword !== "string" || body.newPassword.trim().length < 8) {
      throw nestHttpErrorMapper.toException({
        kind: "validation",
        code: "request.body_invalid",
        message: "newPassword must have at least 8 characters.",
      });
    }

    const executionContext = nestExecutionContextFactory.create(request);
    const tokenStore = this.passwordResetTokens;
    if (tokenStore === undefined) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "auth.password_reset_unavailable",
        message: "Password reset is not available.",
      });
    }

    const secretHash = await this.options.appContext.auth.refreshTokens.hashSecret(body.token);
    const record = await tokenStore.findBySecretHash(secretHash);
    if (record === null || record.consumedAt !== undefined) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "auth.password_reset_token_invalid",
        message: "Password reset token is invalid.",
      });
    }

    const expiresAt = String(record.expiresAt);
    if (Date.parse(expiresAt) <= Date.now()) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "auth.password_reset_token_expired",
        message: "Password reset token is expired.",
      });
    }

    const user = await this.options.appContext.auth.users.findById(String(record.userId));
    if (user === null || user.status !== "active") {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "auth.password_reset_token_invalid",
        message: "Password reset token is invalid.",
      });
    }

    const currentCredentials = await this.options.appContext.auth.userCredentials.findByEmail(
      user.email,
    );
    if (currentCredentials === null || currentCredentials.status !== "active") {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "auth.password_reset_token_invalid",
        message: "Password reset token is invalid.",
      });
    }

    const now = this.options.appContext.clock.now().toISOString();
    const updatedCredentials = UserCredentials.create({
      userId: currentCredentials.userId,
      email: currentCredentials.email,
      passwordHash: await this.options.appContext.auth.passwordHasher.hashPassword(
        body.newPassword,
      ),
      status: currentCredentials.status,
      createdAt: currentCredentials.createdAt,
      updatedAt: now,
    });
    if (!updatedCredentials.ok) {
      return nestHttpErrorMapper.unwrap(updatedCredentials);
    }

    await this.options.appContext.auth.userCredentials.save(updatedCredentials.data);
    await tokenStore.save({
      ...record,
      consumedAt: now,
    });

    await sendOptionalEmailNotification(
      this.options.appContext as never,
      "sendPasswordChangedEmail",
      {
        to: user.email,
        userId: user.id,
        ...(user.displayName === undefined ? {} : { displayName: user.displayName }),
        changedAt: now,
      },
    );

    this.options.appContext.logger.info("Password reset completed.", {
      requestId: executionContext.requestId,
      userId: user.id,
    });

    return { changed: true };
  }
}
