import { ExecutionContext, type ExecutionContextInput } from "./execution.context.ts";

export type AppContextInput = {
  executionContextInput: ExecutionContextInput;
}

export class AppContext {
  public executionContext: ExecutionContext;

  constructor(input: AppContextInput) {
    this.executionContext = new ExecutionContext(input.executionContextInput);
  }
}
