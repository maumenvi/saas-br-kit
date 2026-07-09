export const ORGANIZATION_STATUSES = ["active", "disabled"] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];
