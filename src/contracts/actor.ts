import { USER_STATUSES, type UserStatus } from "../core/index.ts";
import {
  ContractSchema,
  invalid,
  isPlainRecord,
  mergeValidationIssues,
  valid,
  validateEmail,
  validateEnum,
  validateIsoDateTime,
  validateNonEmptyString,
} from "./schema-validation.ts";

export type ActorDto = Readonly<{
  id: string;
  email: string;
  displayName?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateActorInputDto = Readonly<{
  email: string;
  password: string;
  displayName?: string;
}>;

export type CreateAccountInputDto = Readonly<{
  email: string;
  password: string;
  displayName?: string;
  organizationName: string;
  organizationSubdomain?: string;
  organizationUrl?: string;
}>;

export type UpdateActorInputDto = Readonly<{
  displayName?: string | null;
  status?: UserStatus;
}>;

export type LoginInputDto = Readonly<{
  email: string;
  password: string;
  deviceId?: string;
  organizationUrl?: string | null;
}>;

export type ChangePasswordInputDto = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;

export type ForgotPasswordInputDto = Readonly<{
  email: string;
  resetUrlBase?: string;
}>;

export type ResetPasswordInputDto = Readonly<{
  token: string;
  newPassword: string;
}>;

const userStatusSchema = new ContractSchema<UserStatus>("userStatus", (value, path) =>
  validateEnum(value, path, USER_STATUSES),
);

export const createActorInputSchema = new ContractSchema<CreateActorInputDto>(
  "createActorInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected create actor input object.");
    }
    const email = validateEmail(value.email, [...path, "email"]);
    const password = validateNonEmptyString(value.password, [...path, "password"]);
    const displayName =
      value.displayName === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.displayName, [...path, "displayName"]);
    const issues = [
      ...mergeValidationIssues([email, password, displayName]),
      ...(password.ok && password.value.length < 8
        ? [
            {
              path: [...path, "password"],
              message: "Expected password with at least 8 characters.",
            },
          ]
        : []),
    ];
    if (issues.length > 0 || !email.ok || !password.ok || !displayName.ok) {
      return { ok: false, issues };
    }
    return valid(
      Object.freeze({
        email: email.value,
        password: password.value,
        ...(displayName.value === undefined ? {} : { displayName: displayName.value }),
      }),
    );
  },
);

export const createAccountInputSchema = new ContractSchema<CreateAccountInputDto>(
  "createAccountInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected create account input object.");
    }

    const email = validateEmail(value.email, [...path, "email"]);
    const password = validateNonEmptyString(value.password, [...path, "password"]);
    const displayName =
      value.displayName === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.displayName, [...path, "displayName"]);
    const organizationName = validateNonEmptyString(value.organizationName, [
      ...path,
      "organizationName",
    ]);
    const organizationSubdomain =
      value.organizationSubdomain === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.organizationSubdomain, [...path, "organizationSubdomain"]);
    const organizationUrl =
      value.organizationUrl === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.organizationUrl, [...path, "organizationUrl"]);

    const issues = [
      ...mergeValidationIssues([
        email,
        password,
        displayName,
        organizationName,
        organizationSubdomain,
        organizationUrl,
      ]),
      ...(password.ok && password.value.length < 8
        ? [
            {
              path: [...path, "password"],
              message: "Expected password with at least 8 characters.",
            },
          ]
        : []),
    ];

    if (
      issues.length > 0 ||
      !email.ok ||
      !password.ok ||
      !displayName.ok ||
      !organizationName.ok ||
      !organizationSubdomain.ok ||
      !organizationUrl.ok
    ) {
      return { ok: false, issues };
    }

    return valid(
      Object.freeze({
        email: email.value,
        password: password.value,
        ...(displayName.value === undefined ? {} : { displayName: displayName.value }),
        organizationName: organizationName.value,
        ...(organizationSubdomain.value === undefined
          ? {}
          : { organizationSubdomain: organizationSubdomain.value }),
        ...(organizationUrl.value === undefined ? {} : { organizationUrl: organizationUrl.value }),
      }),
    );
  },
);

export const updateActorInputSchema = new ContractSchema<UpdateActorInputDto>(
  "updateActorInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected update actor input object.");
    }
    const displayName =
      value.displayName === undefined || value.displayName === null
        ? valid<string | null | undefined>(value.displayName)
        : validateNonEmptyString(value.displayName, [...path, "displayName"]);
    const status =
      value.status === undefined
        ? valid<UserStatus | undefined>(undefined)
        : userStatusSchema.validate(value.status, [...path, "status"]);
    const issues = mergeValidationIssues([displayName, status]);
    if (issues.length > 0 || !displayName.ok || !status.ok) {
      return { ok: false, issues };
    }
    return valid(
      Object.freeze({
        ...(displayName.value === undefined ? {} : { displayName: displayName.value }),
        ...(status.value === undefined ? {} : { status: status.value }),
      }),
    );
  },
);

export const loginInputSchema = new ContractSchema<LoginInputDto>("loginInput", (value, path) => {
  if (!isPlainRecord(value)) {
    return invalid(path, "Expected login input object.");
  }
  const email = validateEmail(value.email, [...path, "email"]);
  const password = validateNonEmptyString(value.password, [...path, "password"]);
  const deviceId =
    value.deviceId === undefined
      ? valid<string | undefined>(undefined)
      : validateNonEmptyString(value.deviceId, [...path, "deviceId"]);
  const organizationUrl =
    value.organizationUrl === undefined || value.organizationUrl === null
      ? valid<string | null | undefined>(value.organizationUrl)
      : validateNonEmptyString(value.organizationUrl, [...path, "organizationUrl"]);
  const issues = mergeValidationIssues([email, password, deviceId, organizationUrl]);
  if (issues.length > 0 || !email.ok || !password.ok || !deviceId.ok || !organizationUrl.ok) {
    return { ok: false, issues };
  }
  return valid(
    Object.freeze({
      email: email.value,
      password: password.value,
      ...(deviceId.value === undefined ? {} : { deviceId: deviceId.value }),
      ...(organizationUrl.value === undefined ? {} : { organizationUrl: organizationUrl.value }),
    }),
  );
});

export const changePasswordInputSchema = new ContractSchema<ChangePasswordInputDto>(
  "changePasswordInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected change password input object.");
    }
    const currentPassword = validateNonEmptyString(value.currentPassword, [
      ...path,
      "currentPassword",
    ]);
    const newPassword = validateNonEmptyString(value.newPassword, [...path, "newPassword"]);
    const issues = [
      ...mergeValidationIssues([currentPassword, newPassword]),
      ...(newPassword.ok && newPassword.value.length < 8
        ? [
            {
              path: [...path, "newPassword"],
              message: "Expected newPassword with at least 8 characters.",
            },
          ]
        : []),
      ...(currentPassword.ok && newPassword.ok && currentPassword.value === newPassword.value
        ? [
            {
              path: [...path, "newPassword"],
              message: "Expected newPassword different from currentPassword.",
            },
          ]
        : []),
    ];
    if (issues.length > 0 || !currentPassword.ok || !newPassword.ok) {
      return { ok: false, issues };
    }
    return valid(
      Object.freeze({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    );
  },
);

export const forgotPasswordInputSchema = new ContractSchema<ForgotPasswordInputDto>(
  "forgotPasswordInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected forgot password input object.");
    }
    const email = validateEmail(value.email, [...path, "email"]);
    const resetUrlBase =
      value.resetUrlBase === undefined
        ? valid<string | undefined>(undefined)
        : validateNonEmptyString(value.resetUrlBase, [...path, "resetUrlBase"]);
    const issues = mergeValidationIssues([email, resetUrlBase]);
    if (issues.length > 0 || !email.ok || !resetUrlBase.ok) {
      return { ok: false, issues };
    }
    return valid(
      Object.freeze({
        email: email.value,
        ...(resetUrlBase.value === undefined ? {} : { resetUrlBase: resetUrlBase.value }),
      }),
    );
  },
);

export const resetPasswordInputSchema = new ContractSchema<ResetPasswordInputDto>(
  "resetPasswordInput",
  (value, path) => {
    if (!isPlainRecord(value)) {
      return invalid(path, "Expected reset password input object.");
    }
    const token = validateNonEmptyString(value.token, [...path, "token"]);
    const newPassword = validateNonEmptyString(value.newPassword, [...path, "newPassword"]);
    const issues = [
      ...mergeValidationIssues([token, newPassword]),
      ...(newPassword.ok && newPassword.value.length < 8
        ? [
            {
              path: [...path, "newPassword"],
              message: "Expected newPassword with at least 8 characters.",
            },
          ]
        : []),
    ];
    if (issues.length > 0 || !token.ok || !newPassword.ok) {
      return { ok: false, issues };
    }
    return valid(
      Object.freeze({
        token: token.value,
        newPassword: newPassword.value,
      }),
    );
  },
);

export const actorDtoSchema = new ContractSchema<ActorDto>("actorDto", (value, path) => {
  if (!isPlainRecord(value)) {
    return invalid(path, "Expected actor object.");
  }
  const id = validateNonEmptyString(value.id, [...path, "id"]);
  const email = validateEmail(value.email, [...path, "email"]);
  const displayName =
    value.displayName === undefined
      ? valid<string | undefined>(undefined)
      : validateNonEmptyString(value.displayName, [...path, "displayName"]);
  const status = userStatusSchema.validate(value.status, [...path, "status"]);
  const createdAt = validateIsoDateTime(value.createdAt, [...path, "createdAt"]);
  const updatedAt = validateIsoDateTime(value.updatedAt, [...path, "updatedAt"]);
  const issues = mergeValidationIssues([id, email, displayName, status, createdAt, updatedAt]);
  if (
    issues.length > 0 ||
    !id.ok ||
    !email.ok ||
    !displayName.ok ||
    !status.ok ||
    !createdAt.ok ||
    !updatedAt.ok
  ) {
    return { ok: false, issues };
  }
  return valid(
    Object.freeze({
      id: id.value,
      email: email.value,
      ...(displayName.value === undefined ? {} : { displayName: displayName.value }),
      status: status.value,
      createdAt: createdAt.value,
      updatedAt: updatedAt.value,
    }),
  );
});
