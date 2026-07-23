import type { AuditRepositoryPort } from '../core/entities/audit/audit.repositories.ts';
import type { Audit } from '../core/entities/audit/audit.ts';

export class AuditRepositoryMock implements AuditRepositoryPort {
  readonly audits: Audit[] = [];

  save(audit: Audit): Promise<void> {
    this.audits.push(audit);
    return Promise.resolve();
  }
}
