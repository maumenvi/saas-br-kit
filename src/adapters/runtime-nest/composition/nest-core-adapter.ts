import type { GenericRuntimeAdapter } from "#adapters/runtime";
import {
  accessTokenCorePort,
  auditEventRepositoryCorePort,
  billingEventRepositoryCorePort,
  billingProviderSelectorCorePort,
  billingWebhookParserCorePort,
  billingWebhookVerifierCorePort,
  CoreRegistration,
  clockCorePort,
  customerRepositoryCorePort,
  federatedIdentityRepositoryCorePort,
  idGeneratorCorePort,
  loggerCorePort,
  membershipRepositoryCorePort,
  organizationRepositoryCorePort,
  passwordHasherCorePort,
  passwordResetTokenRepositoryCorePort,
  planRepositoryCorePort,
  refreshTokenStoreCorePort,
  runtimeAdapterCorePort,
  sessionManagerCorePort,
  subscriptionRepositoryCorePort,
  transactionManagerCorePort,
  userCredentialsRepositoryCorePort,
  userRepositoryCorePort,
  webhookEventRepositoryCorePort,
} from "#core";
import type { SaasBrNestOptions } from "../module/options.ts";
import { type NestRuntimeClient, nestRuntimeAdapter } from "../nest-runtime-adapter.ts";
import { NestCoreAdapterOutput } from "./nest-core-adapter-output.ts";

export type NestCoreAdapterInput = Omit<SaasBrNestOptions, "appContext">;

export type NestCoreAdapterContext = Readonly<{
  adapters: Readonly<{ runtime: GenericRuntimeAdapter<NestRuntimeClient> }>;
}>;

/** Creates a Nest registration that validates every port consumed by the runtime. */
export function nestCoreAdapter(
  input: NestCoreAdapterInput = {},
): CoreRegistration<"nest", NestCoreAdapterContext, NestCoreAdapterOutput> {
  const options = Object.freeze({
    ...input,
    ...(input.invitation === undefined
      ? {}
      : { invitation: Object.freeze({ ...input.invitation }) }),
    ...(input.oidc === undefined
      ? {}
      : {
          oidc: Object.freeze({
            ...input.oidc,
            providers: Object.freeze([...input.oidc.providers]),
          }),
        }),
  });
  return new CoreRegistration({
    name: "nest",
    requires: [
      clockCorePort,
      idGeneratorCorePort,
      loggerCorePort,
      transactionManagerCorePort,
      organizationRepositoryCorePort,
      planRepositoryCorePort,
      subscriptionRepositoryCorePort,
      billingEventRepositoryCorePort,
      auditEventRepositoryCorePort,
      webhookEventRepositoryCorePort,
      customerRepositoryCorePort,
      membershipRepositoryCorePort,
      userRepositoryCorePort,
      userCredentialsRepositoryCorePort,
      passwordResetTokenRepositoryCorePort,
      accessTokenCorePort,
      passwordHasherCorePort,
      refreshTokenStoreCorePort,
      sessionManagerCorePort,
      billingProviderSelectorCorePort,
      billingWebhookVerifierCorePort,
      billingWebhookParserCorePort,
      ...(options.oidc === undefined ? [] : [federatedIdentityRepositoryCorePort]),
    ],
    provides: [runtimeAdapterCorePort],
    install: (registry) => {
      const runtime = nestRuntimeAdapter();
      registry.provide(runtimeAdapterCorePort, runtime);
      return {
        context: Object.freeze({
          adapters: Object.freeze({ runtime }),
        }),
        output: new NestCoreAdapterOutput(runtime, options),
        ...(runtime.dispose === undefined ? {} : { dispose: runtime.dispose }),
      };
    },
  });
}
