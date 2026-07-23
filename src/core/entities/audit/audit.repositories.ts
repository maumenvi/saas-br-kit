import type { Audit } from './audit.ts';

export interface AuditRepositoryPort {
  save(audit: Audit): Promise<void>;
}
