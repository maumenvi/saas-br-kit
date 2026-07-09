import type { CoreError, Result } from "../../errors/result.ts";

export type UseCaseResult<TValue, TError extends CoreError = CoreError> = Result<TValue, TError>;
