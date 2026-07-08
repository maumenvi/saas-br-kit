export const CUSTOMER_STATUSES = ["active", "disabled"] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
