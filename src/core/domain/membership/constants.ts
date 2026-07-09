export const MEMBERSHIP_STATUSES = ["active", "invited", "disabled"] as const;

export type MembershipRole = string;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
