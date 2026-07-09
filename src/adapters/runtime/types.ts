import type { AppContext } from "../../core/index.ts";

export type RuntimeAdapterCapability =
  | "dependency-injection"
  | "http"
  | "server-context"
  | "server-actions"
  | "controllers"
  | "swagger"
  | "webhooks";

export type RuntimeAdapterDescriptor = Readonly<{
  runtime: string;
  capabilities: readonly RuntimeAdapterCapability[];
}>;

export type RuntimeHealthStatus = "up" | "down";

export type RuntimeHealth = Readonly<{
  status: RuntimeHealthStatus;
  details?: Readonly<Record<string, unknown>>;
}>;

export type RuntimeContextInput<TRequest = unknown> = Readonly<{
  appContext: AppContext;
  request?: TRequest;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type RuntimeAdapterPort<TContext = unknown, TRequest = unknown> = Readonly<{
  name?: string;
  descriptor: RuntimeAdapterDescriptor;
  createContext?: (input: RuntimeContextInput<TRequest>) => TContext | Promise<TContext>;
  healthCheck?: () => Promise<RuntimeHealth>;
  dispose?: () => Promise<void> | void;
}>;

export type CreateRuntimeAdapterInput<
  TClient extends object,
  TContext = unknown,
  TRequest = unknown,
> = Readonly<{
  name: string;
  client: TClient;
  descriptor: RuntimeAdapterDescriptor;
  createContext?: (
    client: TClient,
    input: RuntimeContextInput<TRequest>,
  ) => TContext | Promise<TContext>;
  healthCheck?: (client: TClient) => Promise<RuntimeHealth>;
  dispose?: (client: TClient) => Promise<void> | void;
}>;

export type RuntimeAdapter<
  TClient extends object,
  TContext = unknown,
  TRequest = unknown,
> = RuntimeAdapterPort<TContext, TRequest> &
  Readonly<{
    name: string;
    client: TClient;
  }>;

export type RuntimeAdapterContract<TAdapter extends RuntimeAdapterPort = RuntimeAdapterPort> =
  Readonly<{
    name: string;
    createAdapter: () => TAdapter | Promise<TAdapter>;
  }>;
