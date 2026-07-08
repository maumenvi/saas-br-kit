import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  type SchemaValidationIssue,
  type SchemaValidationResult,
  valid,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type ExecutionActorDto =
  | Readonly<{ type: "system"; id?: string }>
  | Readonly<{ type: "user"; id: string }>
  | Readonly<{ type: "service"; id: string }>;

export type ExecutionContextDto = Readonly<{
  requestId: string;
  actor: ExecutionActorDto;
  organizationId?: string;
  permissions: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export const executionActorSchema = new ContractSchema<ExecutionActorDto>(
  "executionActor",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected execution actor object.");
    }

    if (value.type === "system") {
      if (value.id !== undefined) {
        const id = validateNonEmptyString(value.id, [...path, "id"]);
        if (!id.ok) {
          return id;
        }
        return valid(Object.freeze({ type: "system", id: id.value }));
      }
      return valid(Object.freeze({ type: "system" }));
    }

    if (value.type === "user" || value.type === "service") {
      const id = validateNonEmptyString(value.id, [...path, "id"]);
      if (!id.ok) {
        return id;
      }
      return valid(Object.freeze({ type: value.type, id: id.value }));
    }

    return invalid([...path, "type"], "Expected actor type system, user or service.");
  },
);

function validatePermissionList(
  value: unknown,
  path: readonly string[],
): SchemaValidationResult<readonly string[]> {
  if (!Array.isArray(value)) {
    return invalid(path, "Expected permissions array.");
  }

  const issues: SchemaValidationIssue[] = [];
  const permissions: string[] = [];
  for (const [index, permission] of value.entries()) {
    const result = validateNonEmptyString(permission, [...path, String(index)]);
    if (result.ok) {
      permissions.push(result.value);
    } else {
      issues.push(...result.issues);
    }
  }

  return issues.length === 0 ? valid(Object.freeze(permissions)) : { ok: false, issues };
}

export const executionContextSchema = new ContractSchema<ExecutionContextDto>(
  "executionContext",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected execution context object.");
    }

    const requestId = validateNonEmptyString(value.requestId, [...path, "requestId"]);
    const actor = executionActorSchema.validate(value.actor, [...path, "actor"]);
    const organizationId =
      value.organizationId === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.organizationId, [...path, "organizationId"]);
    const permissions =
      value.permissions === undefined
        ? valid<readonly string[]>(Object.freeze([]))
        : validatePermissionList(value.permissions, [...path, "permissions"]);
    const issues = [...mergeValidationIssues([requestId, actor, organizationId, permissions])];

    if (
      value.metadata !== undefined &&
      (!isPlainRecord(value.metadata) || Array.isArray(value.metadata))
    ) {
      issues.push({ path: [...path, "metadata"], message: "Expected metadata object." });
    }

    if (issues.length > 0 || !requestId.ok || !actor.ok || !organizationId.ok || !permissions.ok) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        requestId: requestId.value,
        actor: actor.value,
        ...(organizationId.value === undefined ? {} : { organizationId: organizationId.value }),
        permissions: permissions.value,
        ...(value.metadata === undefined ? {} : { metadata: Object.freeze({ ...value.metadata }) }),
      }),
    );
  },
);
