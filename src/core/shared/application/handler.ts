export type Handler<Input, Output> = (input: Input) => Promise<Output>;

export interface Interceptor<Input, Output> {
  intercept(
    input: Input,
    next: Handler<Input, Output>
  ): Promise<Output>;
}