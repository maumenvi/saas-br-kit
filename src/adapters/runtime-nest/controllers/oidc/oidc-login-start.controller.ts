import { Controller, Get, Inject, Param, Redirect } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { oidcRuntimeFor } from "../../oidc/runtime.ts";

@ApiTags("oidc")
@Controller("auth/oidc")
export class OidcLoginStartController {
  private readonly options: SaasBrNestOptions;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  @PublicRoute()
  @Get(":providerId/login")
  @Redirect(undefined, 302)
  @ApiOperation({ summary: "Inicia login OIDC com Authorization Code e PKCE" })
  async start(@Param("providerId") providerId: string) {
    const result = nestHttpErrorMapper.unwrap(
      await oidcRuntimeFor(this.options).start(providerId, "login"),
    );
    return { url: result.authorizationUrl, statusCode: 302 };
  }
}
