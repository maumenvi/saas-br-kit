import test from 'node:test';
import type { ApplicationInput } from '../../../src/composition/application/application.input.ts';

test('Não necessita teste unitário', () => {
  type Statuses = {
    actors: string;
    organizations: string;
    memberships: string;
  };
  type Input = ApplicationInput<unknown, Statuses>;

  const input = undefined as Input | undefined;
  void input;
  console.log('Não é necessário teste unitário para application.input.ts: contém apenas contratos TypeScript.');
});
