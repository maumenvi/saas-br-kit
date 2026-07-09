import { Controller, Get, Inject, Param, Redirect, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { NestRequestLike } from "../../context/execution-context.factory.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { oidcRuntimeFor } from "../../oidc/runtime.ts";

@ApiTags("oidc")
@Controller("auth/oidc")
export class OidcLinkStartController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @Get(":providerId/link")
  @Redirect(undefined, 302)
  @ApiOperation({ summary: "Inicia vínculo OIDC explícito para o actor autenticado" })
  async start(@Param("providerId") providerId: string, @Req() request: NestRequestLike) {
    const userId = request.user?.userId;
    if (userId === undefined) {
      throw nestHttpErrorMapper.toException({
        kind: "authorization",
        code: "federated_identity.user_actor_required",
        message: "Linking an external identity requires an authenticated user.",
      });
    }
    const result = nestHttpErrorMapper.unwrap(
      await oidcRuntimeFor(this.options).start(providerId, "link", userId),
    );
    return { url: result.authorizationUrl, statusCode: 302 };
  }
}
