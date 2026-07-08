import type { DatabaseAdapterPort } from "../../../adapters/database/index.ts";
import type { PaymentProviderPort } from "../../../adapters/payment/index.ts";
import type { RuntimeAdapterPort } from "../../../adapters/runtime/index.ts";
import { CorePort } from "../port.ts";

/** Primary database adapter used by repositories and transactions. */
export const databaseAdapterCorePort = new CorePort<DatabaseAdapterPort>({
  id: "adapter.database",
  description: "Database adapter that owns persistence and transaction integration.",
});

/** Payment adapters registered for diagnostics and provider routing. */
export const paymentAdapterCorePort = new CorePort<PaymentProviderPort>({
  id: "adapter.payment",
  description: "Payment adapter registered with the application.",
  multiple: true,
});

/** Runtime adapters registered as application entry points. */
export const runtimeAdapterCorePort = new CorePort<RuntimeAdapterPort>({
  id: "adapter.runtime",
  description: "Runtime adapter that exposes application entry points.",
  multiple: true,
});
