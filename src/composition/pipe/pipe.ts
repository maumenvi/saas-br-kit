import type { Handler, Interceptor } from '../../core/shared/application/interceptor/handler.ts';

export function pipe<Input, Output>(
  handler: Handler<Input, Output>,
  ...interceptors: Interceptor<Input, Output>[]
): Handler<Input, Output> {
  return interceptors.reduceRight<Handler<Input, Output>>(
    (next, interceptor) => (input: Input) => interceptor.intercept(input, next),
    handler
  );
}