import { CoreBuildError, CoreCompositionError } from "./errors.ts";
import type { CoreContextFragment, CoreRegistration } from "./registration.ts";
import type { CorePortRegistry } from "./registry.ts";

export type ResolvedCoreRegistration = Readonly<{
  registration: CoreRegistration<string, CoreContextFragment, unknown>;
  context: CoreContextFragment;
  output: unknown;
  dispose?: () => Promise<void> | void;
}>;

/** Resolves registrations according to declared port dependencies. */
export class CoreRegistrationResolver {
  /** Installs every resolvable registration without depending on declaration order. */
  async resolve(
    registrations: readonly CoreRegistration<string, CoreContextFragment, unknown>[],
    registry: CorePortRegistry,
  ): Promise<readonly ResolvedCoreRegistration[]> {
    const pending = [...registrations];
    const resolved: ResolvedCoreRegistration[] = [];

    while (pending.length > 0) {
      const index = pending.findIndex((registration) =>
        registration.requires.every((port) => registry.has(port)),
      );
      if (index < 0) {
        throw this.unresolvedError(pending, registry);
      }
      const registration = pending.splice(index, 1)[0];
      if (registration === undefined) {
        throw new CoreCompositionError(
          "core.registration_resolution_failed",
          "Registration resolution produced an invalid empty entry.",
        );
      }
      resolved.push(await this.install(registration, registry));
    }

    return Object.freeze(resolved);
  }

  private async install(
    registration: CoreRegistration<string, CoreContextFragment, unknown>,
    registry: CorePortRegistry,
  ): Promise<ResolvedCoreRegistration> {
    const counts = new Map(
      registration.provides.map((port) => [port.id, registry.count(port)] as const),
    );
    const installed = await registration.install(registry);
    const missing = registration.provides.filter(
      (port) => registry.count(port) <= (counts.get(port.id) ?? 0),
    );
    if (missing.length > 0) {
      throw new CoreCompositionError(
        "core.registration_contract_invalid",
        `Registration "${registration.name}" did not provide: ${missing
          .map((port) => port.id)
          .join(", ")}.`,
      );
    }
    return Object.freeze({
      registration,
      context: installed.context,
      output: installed.output,
      ...(installed.dispose === undefined ? {} : { dispose: installed.dispose }),
    });
  }

  private unresolvedError(
    pending: readonly CoreRegistration<string, CoreContextFragment, unknown>[],
    registry: CorePortRegistry,
  ): CoreBuildError {
    const issues = pending.flatMap((registration) =>
      registration.requires
        .filter((port) => !registry.has(port))
        .map(
          (port) =>
            `${port.id} is required by registration "${registration.name}": ${port.description}`,
        ),
    );
    return new CoreBuildError(
      issues.length === 0 ? ["Registration dependency cycle detected."] : issues,
    );
  }
}
