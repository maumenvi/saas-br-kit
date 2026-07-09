import type {
  CreateRuntimeAdapterInput,
  RuntimeAdapter,
  RuntimeAdapterDescriptor,
  RuntimeContextInput,
  RuntimeHealth,
} from "./types.ts";

/**
 * Stores a generic runtime client and delegates context creation through callbacks.
 */
export class GenericRuntimeAdapter<TClient extends object, TContext = unknown, TRequest = unknown>
  implements RuntimeAdapter<TClient, TContext, TRequest>
{
  /** Adapter name exposed to diagnostics and runtime composition. */
  public readonly name: string;

  /** Native runtime client preserved for external adapter code. */
  public readonly client: TClient;

  /** Runtime capabilities advertised to composition code. */
  public readonly descriptor: RuntimeAdapterDescriptor;

  /** Optional context factory bound to the native runtime client. */
  public readonly createContext?: (
    input: RuntimeContextInput<TRequest>,
  ) => TContext | Promise<TContext>;

  /** Optional health check bound to the native runtime client. */
  public readonly healthCheck?: () => Promise<RuntimeHealth>;

  /** Optional cleanup hook bound to the native runtime client. */
  public readonly dispose?: () => Promise<void>;

  /** Stores adapter callbacks while preserving the native runtime client. */
  constructor(input: CreateRuntimeAdapterInput<TClient, TContext, TRequest>) {
    this.name = input.name;
    this.client = input.client;
    this.descriptor = Object.freeze({
      runtime: input.descriptor.runtime,
      capabilities: Object.freeze([...input.descriptor.capabilities]),
    });

    if (input.createContext !== undefined) {
      const createContext = input.createContext;
      this.createContext = (contextInput) => createContext(this.client, contextInput);
    }

    if (input.healthCheck !== undefined) {
      const healthCheck = input.healthCheck;
      this.healthCheck = async () => healthCheck(this.client);
    }

    if (input.dispose !== undefined) {
      const dispose = input.dispose;
      this.dispose = async () => {
        await dispose(this.client);
      };
    }

    Object.freeze(this);
  }
}
