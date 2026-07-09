export const USER_CREDENTIAL_STATUSES = ["active", "disabled"] as const;

export type UserCredentialStatus = (typeof USER_CREDENTIAL_STATUSES)[number];
