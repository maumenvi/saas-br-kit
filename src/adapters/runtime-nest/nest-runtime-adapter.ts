import { GenericRuntimeAdapter } from "#adapters/runtime";
import { SaasBrModule } from "./module/saas-br.module.ts";

export type NestRuntimeClient = Readonly<{
  module: typeof SaasBrModule;
}>;

/** Creates the official external Nest runtime adapter descriptor. */
export function nestRuntimeAdapter(
  client: NestRuntimeClient = { module: SaasBrModule },
): GenericRuntimeAdapter<NestRuntimeClient> {
  return new GenericRuntimeAdapter({
    name: "nest",
    client,
    descriptor: {
      runtime: "nest",
      capabilities: ["dependency-injection", "http", "controllers", "swagger", "webhooks"],
    },
    healthCheck: async () => ({ status: "up" }),
  });
}
