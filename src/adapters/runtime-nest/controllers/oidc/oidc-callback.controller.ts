import { Controller, Get, Inject, Param, Query, Req } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LinkFederatedIdentityUseCase, LoginWithFederatedIdentityUseCase } from "#core";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { OidcCallbackResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { oidcRuntimeFor } from "../../oidc/runtime.ts";

@ApiTags("oidc")
@Controller("auth/oidc")
export class OidcCallbackController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Get(":providerId/callback")
  @ApiOperation({ summary: "Valida callback OIDC e cria sessão ou vínculo local" })
  @ApiOkResponse({ type: OidcCallbackResponseDto })
  async callback(
    @Param("providerId") providerId: string,
    @Query() rawQuery: Readonly<Record<string, unknown>>,
    @Req() request: NestRequestLike,
  ) {
    const completed = nestHttpErrorMapper.unwrap(
      await oidcRuntimeFor(this.options).complete(providerId, this.normalizeQuery(rawQuery)),
    );
    const federatedIdentities = this.options.appContext.auth.federatedIdentities;
    if (federatedIdentities === undefined) {
      throw nestHttpErrorMapper.toException({
        kind: "infrastructure",
        code: "oidc.federated_identity_repository_missing",
        message: "Federated identity repository is required for OIDC.",
      });
    }
    const appContext = Object.freeze({
      ...this.options.appContext,
      auth: Object.freeze({
        ...this.options.appContext.auth,
        federatedIdentities,
      }),
    });
    const requestId = this.requestId(request);
    if (completed.transaction.flow === "link") {
      const userId = completed.transaction.userId;
      if (userId === undefined) {
        throw nestHttpErrorMapper.toException({
          kind: "authorization",
          code: "oidc.link_user_missing",
          message: "OIDC link transaction has no authenticated user.",
        });
      }
      const identity = nestHttpErrorMapper.unwrap(
        await new LinkFederatedIdentityUseCase(appContext).execute(
          nestExecutionContextFactory.create(
            requestId === undefined ? undefined : { headers: { "x-request-id": requestId } },
            { actorId: userId },
          ),
          completed.identity,
        ),
      );
      return Object.freeze({ flow: "link", identity });
    }

    const auth = nestHttpErrorMapper.unwrap(
      await new LoginWithFederatedIdentityUseCase(appContext).execute(
        nestExecutionContextFactory.create(
          requestId === undefined ? undefined : { headers: { "x-request-id": requestId } },
        ),
        completed.identity,
      ),
    );
    return Object.freeze({ flow: "login", ...auth });
  }

  private normalizeQuery(
    query: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, string | undefined>> {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(query).map(([key, value]) => [
          key,
          typeof value === "string" ? value : undefined,
        ]),
      ),
    );
  }

  private requestId(request: NestRequestLike): string | undefined {
    for (const [key, value] of Object.entries(request.headers ?? {})) {
      if (key.toLowerCase() !== "x-request-id") continue;
      return typeof value === "string" ? value : value?.[0];
    }
    return undefined;
  }
}
