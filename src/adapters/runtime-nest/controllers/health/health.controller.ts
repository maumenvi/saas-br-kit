import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { PublicRoute } from "../../auth/public-route.decorator.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

/** Exposes runtime and adapter health for the Nest integration. */
@ApiTags("health")
@Controller("health")
export class HealthController {
  private readonly options: SaasBrNestOptions;

  /** Stores the runtime options used by health checks. */
  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
  }

  /** Returns basic runtime health. */
  @PublicRoute()
  @Get()
  @ApiOkResponse({ description: "Runtime is up." })
  async getHealth(): Promise<Readonly<Record<string, unknown>>> {
    const database = this.options.appContext.adapters.database as
      | { healthCheck?: () => Promise<unknown> }
      | undefined;
    const databaseHealth = await database?.healthCheck?.();
    return {
      status: "up",
      ...(databaseHealth === undefined ? {} : { database: databaseHealth }),
    };
  }
}
