import { type CoreErrorDto, coreErrorSchema } from "./core-error.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  valid,
} from "./schema-validation.ts";

export type SuccessResultDto<TValue> = Readonly<{
  ok: true;
  data: TValue;
}>;

export type FailureResultDto<TError = CoreErrorDto> = Readonly<{
  ok: false;
  error: TError;
}>;

export type ResultDto<TValue, TError = CoreErrorDto> =
  | SuccessResultDto<TValue>
  | FailureResultDto<TError>;

export function successResultSchema<TValue>(
  dataSchema: ContractSchema<TValue>,
): ContractSchema<SuccessResultDto<TValue>> {
  return new ContractSchema<SuccessResultDto<TValue>>("successResult", (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected success result object.");
    }

    if (value.ok !== true) {
      return invalid([...path, "ok"], "Expected ok=true.");
    }

    const data = dataSchema.validate(value.data, [...path, "data"]);
    if (!data.ok) {
      return data;
    }

    return valid(Object.freeze({ ok: true, data: data.value }));
  });
}

export function failureResultSchema<TError = CoreErrorDto>(
  errorSchema: ContractSchema<TError> = coreErrorSchema as ContractSchema<TError>,
): ContractSchema<FailureResultDto<TError>> {
  return new ContractSchema<FailureResultDto<TError>>("failureResult", (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected failure result object.");
    }

    if (value.ok !== false) {
      return invalid([...path, "ok"], "Expected ok=false.");
    }

    const error = errorSchema.validate(value.error, [...path, "error"]);
    if (!error.ok) {
      return error;
    }

    return valid(Object.freeze({ ok: false, error: error.value }));
  });
}

export function resultSchema<TValue, TError = CoreErrorDto>(
  dataSchema: ContractSchema<TValue>,
  errorSchema: ContractSchema<TError> = coreErrorSchema as ContractSchema<TError>,
): ContractSchema<ResultDto<TValue, TError>> {
  return new ContractSchema<ResultDto<TValue, TError>>("result", (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected result object.");
    }

    if (value.ok === true) {
      return successResultSchema(dataSchema).validate(value, path);
    }

    if (value.ok === false) {
      return failureResultSchema(errorSchema).validate(value, path);
    }

    const success = successResultSchema(dataSchema).validate(value, path);
    const failure = failureResultSchema(errorSchema).validate(value, path);
    return {
      ok: false,
      issues: mergeValidationIssues([success, failure]),
    };
  });
}
