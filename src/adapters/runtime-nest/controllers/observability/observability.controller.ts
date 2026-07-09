import { Controller, ForbiddenException, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { NestRequestLike } from "../../context/execution-context.factory.ts";

type AuthenticatedRequest = NestRequestLike &
  Readonly<{
    user: Readonly<{
      userId: string;
      permissions: readonly string[];
    }>;
  }>;

/** Exposes safe observability endpoints metadata for authenticated actors. */
@ApiTags("observability")
@ApiBearerAuth()
@Controller("observability")
export class ObservabilityController {
  /** Returns configured observability endpoints when the actor has read permission. */
  @Get()
  @ApiOperation({ summary: "Retorna endpoints de observabilidade configurados" })
  @ApiOkResponse({
    description: "Observability endpoints available to the authenticated actor.",
    schema: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        endpoints: {
          type: "object",
          properties: {
            grafana: { type: "string", nullable: true },
            loki: { type: "string", nullable: true },
            tempo: { type: "string", nullable: true },
            prometheus: { type: "string", nullable: true },
            otelCollector: { type: "string", nullable: true },
          },
        },
      },
    },
  })
  getObservability(@Req() request: AuthenticatedRequest) {
    this.ensureObservabilityReadPermission(request.user.permissions);

    return {
      actorId: request.user.userId,
      endpoints: {
        grafana: process.env.OBSERVABILITY_GRAFANA_URL ?? null,
        loki: process.env.OBSERVABILITY_LOKI_URL ?? null,
        tempo: process.env.OBSERVABILITY_TEMPO_URL ?? null,
        prometheus: process.env.OBSERVABILITY_PROMETHEUS_URL ?? null,
        otelCollector: process.env.OBSERVABILITY_OTEL_COLLECTOR_URL ?? null,
      },
    } as const;
  }

  private ensureObservabilityReadPermission(permissions: readonly string[]): void {
    if (permissions.includes("*") || permissions.includes("observability:read")) {
      return;
    }

    throw new ForbiddenException({
      error: {
        kind: "authorization",
        code: "core.permission_denied",
        message: "Execution context does not include the required permission.",
        details: { permission: "observability:read" },
      },
    });
  }
}
