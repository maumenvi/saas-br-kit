export const PLAN_STATUSES = ["active", "inactive"] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type PlanBillingInterval = (typeof PLAN_BILLING_INTERVALS)[number];

export type PlanCurrency = "BRL";
