import type { CoreError } from "../../errors/result.ts";
import type { UseCaseResult } from "./use-case-result.ts";

export type UseCase<TInput, TValue, TError extends CoreError = CoreError> = (
  input: TInput,
) => Promise<UseCaseResult<TValue, TError>>;
