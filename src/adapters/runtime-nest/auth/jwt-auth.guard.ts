import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { VerifiedAccessToken } from "#core";
import type { SaasBrNestOptions } from "../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../module/tokens.ts";
import { IS_PUBLIC_ROUTE } from "./public-route.decorator.ts";
import {
  type AuthenticatedRequestUser,
  RequestAuthorizationResolver,
} from "./request-authorization.resolver.ts";

type RequestWithHeaders = {
  headers: Record<string, string | readonly string[] | undefined>;
  user?: AuthenticatedRequestUser;
};

/** Verifies internal access tokens and attaches current persisted authorization to requests. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly reflector: Reflector;
  private readonly options: SaasBrNestOptions;

  /** Stores Nest metadata access and the immutable runtime options. */
  constructor(reflector: Reflector, @Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.reflector = reflector;
    this.options = options;
  }

  /** Allows public routes or authenticates and authorizes protected HTTP requests. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (token === undefined) {
      throw new UnauthorizedException({
        error: {
          kind: "authorization",
          code: "auth.access_token_missing",
          message: "Access token is required.",
        },
      });
    }

    const verified = await (
      this.options.appContext.auth.accessTokens as {
        verifyAccessToken?: (
          token: string,
        ) => Promise<
          | { ok: true; data: VerifiedAccessToken }
          | { ok: false; error: { code: string; message: string } }
        >;
      }
    ).verifyAccessToken?.(token);
    if (verified === undefined || !verified.ok) {
      throw new UnauthorizedException({
        error: {
          kind: "authorization",
          code: verified?.error.code ?? "auth.access_token_invalid",
          message: verified?.error.message ?? "Access token is invalid.",
        },
      });
    }

    request.user = await new RequestAuthorizationResolver(this.options.appContext).resolve(
      verified.data,
    );
    return true;
  }

  /** Extracts a non-empty bearer credential without decoding it locally. */
  private extractBearerToken(header: string | readonly string[] | undefined): string | undefined {
    const value = Array.isArray(header) ? header[0] : header;
    if (typeof value !== "string") {
      return undefined;
    }
    const [scheme, token] = value.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || token === undefined || token.length === 0) {
      return undefined;
    }
    return token;
  }
}
