import test from 'node:test';
import type { TenantApplication } from '../../../src/composition/application/tenant.application.ts';

test('Não necessita teste unitário', () => {
  const tenant = undefined as TenantApplication<string> | undefined;

  void tenant;
  console.log('Não é necessário teste unitário para tenant.application.ts: contém apenas contratos TypeScript.');
});
