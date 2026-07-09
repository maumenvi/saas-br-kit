import { randomBytes } from "node:crypto";
import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { ForgotPasswordBodyDto } from "../../dto/actor.dto.ts";
import { ForgotPasswordResponseDto } from "../../dto/response.dto.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { sendOptionalEmailNotification } from "../../notifications/send-optional-email-notification.ts";

@ApiTags("actors")
@Controller("actors")
export class ActorsForgotPasswordController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  private get passwordResetTokens() {
    return (
      this.options.appContext.auth as {
        passwordResetTokens?: Readonly<{
          save(record: Readonly<Record<string, unknown>>): Promise<void>;
        }>;
      }
    ).passwordResetTokens;
  }

  @PublicRoute()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Solicita token de recuperação de senha" })
  @ApiOkResponse({ type: ForgotPasswordResponseDto })
  async forgotPassword(@Body() body: ForgotPasswordBodyDto, @Req() request: NestRequestLike) {
    const executionContext = nestExecutionContextFactory.create(request);
    const normalizedEmail = body.email.trim().toLowerCase();
    const credentials =
      await this.options.appContext.auth.userCredentials.findByEmail(normalizedEmail);
    if (credentials === null || credentials.status !== "active") {
      return { requested: true };
    }

    const user = await this.options.appContext.auth.users.findById(credentials.userId);
    if (user === null || user.status !== "active") {
      return { requested: true };
    }

    const tokenStore = this.passwordResetTokens;
    if (tokenStore === undefined) {
      this.options.appContext.logger.error("Password reset token store is not configured.", {
        requestId: executionContext.requestId,
        userId: user.id,
      });
      return { requested: true };
    }

    const now = this.options.appContext.clock.now().toISOString();
    const token = randomBytes(32).toString("base64url");
    const secretHash = await this.options.appContext.auth.refreshTokens.hashSecret(token);
    const expiresAt = new Date(Date.parse(now) + 60 * 60 * 1000).toISOString();
    await tokenStore.save({
      id: this.options.appContext.idGenerator.newId(),
      userId: user.id,
      secretHash,
      expiresAt,
      createdAt: now,
    });

    const resetUrl =
      body.resetUrlBase === undefined
        ? undefined
        : new URL(
            token,
            body.resetUrlBase.endsWith("/") ? body.resetUrlBase : `${body.resetUrlBase}/`,
          ).toString();

    await sendOptionalEmailNotification(
      this.options.appContext as never,
      "sendPasswordResetRequestedEmail",
      {
        to: user.email,
        userId: user.id,
        ...(user.displayName === undefined ? {} : { displayName: user.displayName }),
        token,
        ...(resetUrl === undefined ? {} : { resetUrl }),
        expiresAt,
      },
    );

    return { requested: true };
  }
}
