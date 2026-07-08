import type { CoreContextFragment } from "./registration.ts";
import { CoreRegistration } from "./registration.ts";

/**
 * Creates a registration that only contributes a context fragment.
 */
export function contextProperties<TName extends string, TContext extends CoreContextFragment>(
    name: TName,
    context: TContext,
): CoreRegistration<TName, TContext, TContext> {
    const frozenContext = Object.freeze({ ...context }) as TContext;
    return new CoreRegistration({
        name,
        install: () => ({ context: frozenContext, output: frozenContext }),
    });
}
