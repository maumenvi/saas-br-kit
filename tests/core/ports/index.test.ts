import test from 'node:test';
import type { Payload } from '../../../src/core/ports/index.ts';

test('Não necessita teste unitário', () => {
  const payload: Payload = {
    actorId: 'actor-1',
    organizationId: 'organization-1',
  };

  void payload;
  console.log('Não é necessário teste unitário para src/core/ports/index.ts: exporta apenas contratos TypeScript.');
});
