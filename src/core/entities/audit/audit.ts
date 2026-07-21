export const AUDIT_OUTCOMES = ['SUCCESS', 'ERROR'] as const;

export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export type AuditData =
  | null
  | boolean
  | number
  | string
  | AuditData[]
  | { [key: string]: AuditData };

export type AuditError = Readonly<{
  name: string;
  message: string;
  stack: string | null;
  code: string | null;
  target: string | null;
  details: AuditData;
}>;

export type Audit = Readonly<{
  id: string;
  action: string;
  outcome: AuditOutcome;
  actorId: string | null;
  organizationId: string | null;
  membershipId: string | null;
  input: AuditData;
  output: AuditData;
  error: AuditError | null;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}>;
